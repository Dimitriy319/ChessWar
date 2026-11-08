# Полководці античності
Concept: random-map army campaign (fog of war) plus chess duels when generals clash. Art: ancient Greek temple look: night-blue marble background, Doric columns, gold meander bands, bronze buttons, marble board with white and black marble pieces (CSS gradients on the chess glyphs).
Online: власний Node-сервер (WebSocket + Postgres), фронтенд на GitHub Pages. Each match is a room with a 5-char code, stored in SQL `matches`. Two seats (me/foe) are fixed per match, so players can leave and return from "Мої партії" or by code. Rules run in the browser; the server seats players, saves state and relays it.

## Journal
- User asked for rooms + matches that survive leaving. Replaced manual WebRTC code-swap with Nova world + SQL matches. Verified: create, join via open list, turn relayed to the other tab, leave, SQL row saved, server reloads match after restart. Not verified: same player resuming after a preview restart (restarts issue new actor IDs).
- Rules still run client-side; the server does not validate moves yet (accepted for a casual two-player game).
- Added player profiles: name + password, session token kept in the browser, saved per profile in SQL (`profiles`, `sessions`). Match seats now belong to the profile, not the connection, so the same player resumes the same matches from any device. Online wins/losses are counted by the server when a match ends; bot results are reported by the client (trusted). Matches created before this change were seated by connection ID and no longer belong to anyone.

## Files
- index.html: markup only (menu, map, duel overlay); loads css/style.css and js/*.js in the order below.
- css/style.css: all styles (antique theme).
- js/config.js, state.js, chess.js, rules.js, render.js, duel.js, bot.js, net.js: classic scripts that share one global scope, so load order matters. js/ws-client.js is a plain WebSocket client (auto-reconnect) exposing window.StarClient.
- server/: index.mjs (rooms, profiles, relay), store.mjs (SQL), upgrade.mjs (schema).
