# Secure Chat Frontend (Angular 18)

Secure Chat UI built with Angular standalone components, RxJS signals, and Socket.IO client. It connects to the backend at `http://localhost:4000/api` by default (via Angular dev proxy).

## Features
- Chats list displays last message, sorted by latest, with pinned separation
- Direct messages and group chats (create, rename, add/remove members)
- Message reactions (👍 ❤️ 😂 basic UI) with real-time updates
- Media uploads (image/video/file) via composer upload button
- Presence and typing indicators via WebSocket

## Requirements
- Node.js 18+ recommended
- Backend running at `http://localhost:4000` (or set `BACKEND_URL` for proxy)

## Setup
```bash
npm install
```

## Running (Dev)
- `npm run start` or `npm run start:dev` starts the dev server with proxy
- App: `http://localhost:4200`
- Proxy targets:
  - `BACKEND_URL` (default `http://localhost:4000`) for `/api` and `/socket.io`

Proxy config: `proxy.conf.js`
```js
const target = process.env.BACKEND_URL || 'http://localhost:4000';
module.exports = {
  '/api': { target, changeOrigin: true, secure: false, logLevel: 'debug' },
  '/uploads': { target, changeOrigin: true, secure: false, logLevel: 'debug' },
  '/socket.io': { target, ws: true, changeOrigin: true, secure: false, logLevel: 'debug' }
};
```

## Environment
- Dev: `src/environments/environment.development.ts`
```ts
export const environment = {
  production: false,
  envName: 'dev',
  apiBaseUrl: 'http://localhost:4000/api',
  wsUrl: '/socket.io'
};
```
- UAT/Prod configs in `src/environments/*` with `npm run start:uat`, `npm run build:prod` scripts available

## Auth & Session
- On login/register, tokens are saved locally and used for HTTP and WS auth
- WS handshake passes `access_token` via `auth.token`

## Useful Scripts
- `npm run start` – dev server with proxy
- `npm run build` – production build to `dist/secure-chat-frontend`
- `npm test` – unit tests (Karma/Jasmine)

## Notes
- For media uploads: server supports multipart upload and direct URL storage
- If backend CORS is restricted, set `CORS_ORIGIN=http://localhost:4200` in backend `.env`
