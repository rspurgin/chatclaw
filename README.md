# chatclaw
ChatClaw is a lightweight “info exchange” companion for OpenClaw:

- **Client (Vite)**: simple UI that connects to the server
- **Server (Express + Socket.IO)**: relays **chat messages** and **shared data** to all connected clients and logs activity

Right now it’s a small real-time hub you can run locally (e.g., phone ↔︎ Mac Mini) to pass messages/payloads between devices.

## Running (clean clone)

```bash
git clone https://github.com/rspurgin/chatclaw.git
cd chatclaw

cd server
npm ci
npm test
npm run dev
```

In another terminal (client):

```bash
cd client
npm ci
npm run dev
```

## Running (existing clone, remove untracked files)

```bash
git checkout main
git pull
git clean -fdx
```
