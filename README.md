# Полководці античності: публікація

Гра складається з двох частин:
- **Фронтенд** (`index.html`, `css/`, `js/`) іде на **GitHub Pages**.
- **Сервер** (`server/`) іде на **Render** і зберігає профілі та партії в **Neon** (Postgres).

## 1. База даних (Neon)
1. Зареєструйтесь на neon.tech та створіть проєкт.
2. Скопіюйте рядок підключення (`postgresql://...sslmode=require`). Таблиці створюються самі при старті сервера.

## 2. Сервер (Render)
1. Завантажте проєкт на GitHub (див. нижче).
2. render.com → New → Blueprint → оберіть репозиторій (підхопиться `render.yaml`).
3. Задайте змінні:
   - `DATABASE_URL` — рядок із Neon;
   - `ALLOWED_ORIGINS` — `https://ВАШ_ЛОГІН.github.io` (без `/` в кінці).
4. Після деплою скопіюйте адресу сервісу, наприклад `https://chesswar.onrender.com`.

## 3. Фронтенд (GitHub Pages)
1. У `js/ws-client.js` замініть `PROD_URL` на `wss://chesswar.onrender.com/socket` (ваша адреса Render, але з `wss://` і `/socket`).
2. Репозиторій → Settings → Pages → Source: **GitHub Actions**.
3. `git push` у гілку `main` запускає деплой. Гра відкриється за `https://ВАШ_ЛОГІН.github.io/НАЗВА_РЕПО/`.

## Локальний запуск
```
npm install
DATABASE_URL=postgresql://... npm start     # сервер на :8080
npx serve .                                  # або будь-який статичний сервер
```
Запрошення в кімнату: `.../index.html?room=ABCDE`.

## Нотатки
- Безкоштовний Render засинає після ~15 хв без запитів, перше підключення може тривати до хвилини. Профілі й партії при цьому не губляться, бо лежать у Neon.
- Правила гри перевіряє браузер, сервер їх не валідує (див. `DESIGN.md`).
