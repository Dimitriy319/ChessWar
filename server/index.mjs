// Сервер кімнат і профілів для «Полководців». Each room is one match row in SQL.
// The server seats players (side "me" = creator, "foe" = the player who joins),
// keeps every match after everyone leaves, and relays the latest state to the
// seated players. Rules run in the browser that moves.
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { loadMatches, markDirty, flushAll, closeStore, saveStatus, registerProfile, checkProfile, newSession, sessionProfile, dropSession, getProfile, addResult, addBot } from './store.mjs';

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const MAX_STATE = 200_000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const OPEN_LIMIT = 30;

const matches = new Map(); // code -> { code, state, seats: {me, foe}, names: {me, foe} }
const conns = new Set();   // { ws, actor, name, code }
let ready = false;

const err = message => ({ t: 'error', message });
const send = (c, o) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(o)); };
const isState = s => !!s && typeof s === 'object' && Array.isArray(s.map) && Array.isArray(s.gens)
  && JSON.stringify(s).length < MAX_STATE;
const sideOf = (m, actor) => (m.seats.me === actor ? 'me' : m.seats.foe === actor ? 'foe' : null);
const online = actor => !!actor && [...conns].some(c => c.pid === actor);
const presence = m => ({ foeJoined: !!m.seats.foe, online: { me: online(m.seats.me), foe: online(m.seats.foe) } });
const summary = m => ({
  code: m.code, names: m.names, foeJoined: !!m.seats.foe,
  over: !!m.state.over, winner: m.state.winner ?? null,
  turn: m.state.turn ?? null,
});

function newCode() {
  for (let t = 0; t < 50; t++) {
    let c = '';
    for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.random() * CODE_CHARS.length | 0];
    if (!matches.has(c)) return c;
  }
  return null;
}

function sendList(c) {
  const mine = [], open = [];
  for (const m of matches.values()) {
    const side = sideOf(m, c.pid);
    if (side) mine.push({ ...summary(m), side });
    else if (!m.seats.foe && open.length < OPEN_LIMIT) open.push(summary(m));
  }
  send(c, { t: 'list', mine, open });
}
const sendAllLists = () => conns.forEach(sendList);

function sendMatch(m, except) {
  for (const c of conns) {
    if (c !== except && c.code === m.code) send(c, { t: 'state', code: m.code, state: m.state, presence: presence(m) });
  }
}

async function pushProfile(c) {
  const p = await getProfile(c.pid);
  if (p) send(c, { t: 'profile', profile: p });
}

async function auth(c, msg) {
  if (msg.t === 'logout') {
    if (c.token) await dropSession(c.token);
    c.pid = null; c.token = null; c.code = null;
    send(c, { t: 'auth', profile: null });
    return sendList(c);
  }
  if (++c.tries > 15) return send(c, err('Забагато спроб. Оновіть сторінку.'));
  let p = null, token = null;
  if (msg.t === 'resume') {
    token = String(msg.token || '');
    p = token ? await sessionProfile(token) : null;
    if (!p) return send(c, { t: 'auth', profile: null, expired: true });
  } else {
    const name = String(msg.name || '').trim().slice(0, 20), pin = String(msg.pin || '');
    if (name.length < 2 || pin.length < 4) return send(c, err('Ім’я від 2 символів, пароль від 4.'));
    p = msg.t === 'register' ? await registerProfile(name, pin) : await checkProfile(name, pin);
    if (!p) return send(c, err(msg.t === 'register' ? 'Таке ім’я вже зайняте.' : 'Невірне ім’я або пароль.'));
    token = await newSession(p.id);
  }
  c.pid = p.id; c.name = p.name; c.token = token;
  send(c, { t: 'auth', profile: p, token });
  sendList(c);
}

async function scoreMatch(m) {
  const w = m.state.winner;
  const win = w && m.seats[w], lose = w && m.seats[w === 'me' ? 'foe' : 'me'];
  if (!win || !lose) return;
  await addResult(win, lose);
  for (const c of conns) if (c.pid === win || c.pid === lose) await pushProfile(c);
}

function onMessage(c, raw) {
  let msg;
  try { msg = JSON.parse(String(raw)); } catch { return; }
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'ping') return;
  if (['register', 'login', 'resume', 'logout'].includes(msg.t)) return auth(c, msg);
  if (msg.t === 'bot') return c.pid ? addBot(c.pid, !!msg.win).then(() => pushProfile(c)) : undefined;
  if (!c.pid) return send(c, err('Спершу увійдіть у профіль.'));

  if (msg.t === 'list') return sendList(c);
  if (msg.t === 'leave') { c.code = null; return sendList(c); }

  if (msg.t === 'create') {
    if (!isState(msg.state)) return send(c, err('Некоректний стан партії.'));
    const code = newCode();
    if (!code) return send(c, err('Не вдалося створити кімнату, спробуйте ще раз.'));
    const m = { code, state: msg.state, seats: { me: c.pid, foe: null }, names: { me: c.name, foe: null } };
    matches.set(code, m);
    markDirty(m);
    c.code = code;
    send(c, { t: 'joined', code, side: 'me', state: m.state, presence: presence(m) });
    return sendAllLists();
  }

  if (msg.t === 'join') {
    const code = String(msg.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = matches.get(code);
    if (!m) return send(c, err('Кімнату з таким кодом не знайдено.'));
    let side = sideOf(m, c.pid);
    if (!side) {
      if (m.seats.foe) return send(c, err('Кімната вже зайнята.'));
      side = 'foe';
      m.seats.foe = c.pid;
      m.names.foe = c.name;
      markDirty(m);
    }
    c.code = code;
    send(c, { t: 'joined', code, side, state: m.state, presence: presence(m) });
    sendMatch(m, c);
    return sendAllLists();
  }

  if (msg.t === 'state') {
    const m = c.code && matches.get(c.code);
    if (!m || !sideOf(m, c.pid)) return send(c, err('Партію не знайдено. Поверніться до списку кімнат.'));
    if (!isState(msg.state)) return send(c, err('Некоректний стан партії.'));
    const wasOver = !!m.state.over;
    m.state = msg.state;
    markDirty(m);
    sendMatch(m, c);
    if (wasOver !== !!m.state.over) { sendAllLists(); if (m.state.over) scoreMatch(m).catch(e => console.error('score failed', e.message)); }
  }
}

// Дозволені джерела (origin) для WebSocket, через кому. Порожньо = дозволено всім.
// Приклад: ALLOWED_ORIGINS=https://username.github.io
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(ready ? 200 : 503, { 'content-type': 'text/plain' });
    return res.end(ready ? 'ok' : 'starting');
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('Chesswar server');
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });

server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'http://x').pathname !== '/socket') return socket.destroy();
  if (ALLOWED.length && !ALLOWED.includes(String(req.headers.origin || ''))) return socket.destroy();
  wss.handleUpgrade(req, socket, head, ws => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    const c = { ws, name: '', code: null, pid: null, token: null, tries: 0, q: Promise.resolve() };
    conns.add(c);
    ws.on('message', raw => { c.q = c.q.then(() => onMessage(c, raw)).catch(e => console.error('msg failed', e.message)); });
    ws.on('close', () => {
      const code = c.code;
      conns.delete(c);
      const m = code && matches.get(code);
      if (m) sendMatch(m);
    });
    send(c, { t: 'hello' });
  });
});

// Heartbeat: прибирає «мертві» з'єднання, а ще не дає проксі закрити неактивний сокет.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000).unref();

process.once('SIGTERM', async () => {
  const deadline = setTimeout(() => process.exit(1), 4000);
  await flushAll().catch(() => {});
  await closeStore();
  clearTimeout(deadline);
  process.exit(saveStatus() ? 1 : 0);
});

server.listen(PORT, HOST, () => console.log('listening', PORT));

loadMatches()
  .then(rows => {
    for (const r of rows) matches.set(r.code, { code: r.code, state: r.state, seats: r.seats, names: r.names });
    ready = true;
    console.log('matches loaded', rows.length);
  })
  .catch(error => {
    console.error('match load failed', error.message);
    process.exit(1);
  });
