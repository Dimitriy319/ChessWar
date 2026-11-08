import pg from 'pg';
import crypto from 'node:crypto';

// Saved matches live in SQL, one row per room code. Writes are coalesced per
// match: each room keeps only its newest snapshot waiting to be saved.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const dirty = new Map();
let writing = null;
let lastError = null;

export async function loadMatches() {
  const { rows } = await pool.query('SELECT code, state, seats, names FROM matches');
  return rows;
}

export function markDirty(match) {
  dirty.set(match.code, match);
  if (!writing) writing = drain();
}

export async function flushAll() {
  if (writing) await writing;
  if (dirty.size) writing = drain();
  if (writing) await writing;
}

export function saveStatus() {
  return lastError ? lastError.message : null;
}

export async function closeStore() {
  await pool.end().catch(() => {});
}

function save(m) {
  return pool.query(
    `INSERT INTO matches (code, state, seats, names, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
     ON CONFLICT (code) DO UPDATE SET state = EXCLUDED.state,
       seats = EXCLUDED.seats, names = EXCLUDED.names, updated_at = now()`,
    [m.code, JSON.stringify(m.state), JSON.stringify(m.seats), JSON.stringify(m.names)]
  );
}

async function drain() {
  try {
    while (dirty.size) {
      const [code, m] = dirty.entries().next().value;
      dirty.delete(code);
      try {
        await save(m);
        lastError = null;
      } catch (error) {
        lastError = error;
        console.error('match save failed', code, error.message);
        dirty.set(code, m);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } finally {
    writing = null;
  }
}

// ---- Player profiles: name + password, session tokens, win/loss counters.
const sha = v => crypto.createHash('sha256').update(v).digest('hex');
const pub = r => ({ id: r.id, name: r.name, wins: r.wins, losses: r.losses, botWins: r.bot_wins, botLosses: r.bot_losses });

export async function registerProfile(name, pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 32).toString('hex');
  try {
    const { rows } = await pool.query(
      'INSERT INTO profiles (id, name, name_key, salt, hash) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [crypto.randomUUID(), name, name.toLowerCase(), salt, hash]);
    return pub(rows[0]);
  } catch (e) { if (e.code === '23505') return null; throw e; }
}

export async function checkProfile(name, pin) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE name_key = $1', [name.toLowerCase()]);
  const r = rows[0];
  if (!r) return null;
  const h = crypto.scryptSync(pin, r.salt, 32);
  return crypto.timingSafeEqual(h, Buffer.from(r.hash, 'hex')) ? pub(r) : null;
}

export async function newSession(profileId) {
  const token = crypto.randomBytes(24).toString('hex');
  await pool.query('INSERT INTO sessions (token_hash, profile_id) VALUES ($1,$2)', [sha(token), profileId]);
  return token;
}

export async function sessionProfile(token) {
  const { rows } = await pool.query(
    'SELECT p.* FROM sessions s JOIN profiles p ON p.id = s.profile_id WHERE s.token_hash = $1', [sha(token)]);
  return rows[0] ? pub(rows[0]) : null;
}

export const dropSession = token => pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]);

export async function getProfile(id) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
  return rows[0] ? pub(rows[0]) : null;
}

export async function addResult(winId, loseId) {
  await pool.query('UPDATE profiles SET wins = wins + 1 WHERE id = $1', [winId]);
  await pool.query('UPDATE profiles SET losses = losses + 1 WHERE id = $1', [loseId]);
}

export const addBot = (id, win) =>
  pool.query(win ? 'UPDATE profiles SET bot_wins = bot_wins + 1 WHERE id = $1'
                 : 'UPDATE profiles SET bot_losses = bot_losses + 1 WHERE id = $1', [id]);
