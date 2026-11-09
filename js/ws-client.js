// Мережевий клієнт: звичайний WebSocket з автоперепідключенням.
// Віддає той самий інтерфейс, який чекає net.js: createConnection і getLaunchContext.
(function () {
  // Адреса сервера. Для GitHub Pages впишіть сюди адресу вашого сервера на Render
  // (наприклад 'wss://chesswar.onrender.com/socket'). Локально працює ws://localhost:8080/socket.
  const PROD_URL = 'wss://chesswar-7l42.onrender.com/socket';
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const URL_ = window.GAME_SERVER_URL || (isLocal ? 'ws://localhost:8080/socket' : PROD_URL);

  function createConnection({ onConnect, onMessage, onStatus }) {
    let ws = null, tries = 0, timer = null, ping = null;
    const status = (state, message) => {
      try { onStatus && onStatus({ state, error: message ? { message } : null }); } catch (e) { console.error(e); }
    };

    function open() {
      clearTimeout(timer);
      if (ws && ws.readyState <= 1) return;
      status(tries ? 'reconnecting' : 'connecting');
      try { ws = new WebSocket(URL_); } catch (e) { return status('error', 'Невірна адреса сервера: ' + URL_); }
      const mine = ws;
      mine.onopen = () => {
        tries = 0;
        status('connected');
        onConnect && onConnect({});
        clearInterval(ping);
        ping = setInterval(() => { if (mine.readyState === 1) mine.send('{"t":"ping"}'); }, 25000);
      };
      mine.onmessage = e => onMessage && onMessage({ data: e.data });
      mine.onclose = () => {
        clearInterval(ping);
        if (ws !== mine) return;
        tries++;
        status(navigator.onLine === false ? 'offline' : 'reconnecting');
        timer = setTimeout(open, Math.min(1000 * 2 ** Math.min(tries, 4), 15000));
      };
      mine.onerror = () => {};
    }

    addEventListener('online', () => { tries = 0; open(); });
    open();
    return { send: s => { if (ws && ws.readyState === 1) ws.send(s); } };
  }

  // Запрошення за посиланням: https://.../index.html?room=ABCDE
  function getLaunchContext() {
    let code = '';
    try { code = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); } catch (e) {}
    return { invitedRoomCode: code || null };
  }

  window.StarClient = { createConnection, getLaunchContext };
})();
