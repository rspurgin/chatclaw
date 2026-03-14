# chatclaw

ChatClaw is a lightweight real-time message bus for [OpenClaw](https://github.com/rspurgin/chatclaw). It runs on any platform that supports Node.js — Mac, Linux, Raspberry Pi, Docker, cloud VMs.

- **Client** (React + Vite): browser UI for chat and telemetry
- **Server** (Express + Socket.IO): relays messages to all connected clients, logs activity, and exposes a REST API

### Security (HMAC-OTP)

The server includes a **stateful HMAC-OTP stream cipher** for secure device-to-device traffic. It uses the Web Crypto API (`crypto.subtle`) so the same code runs on Node and in browsers/React Native.

- **`SecurityManager`** (`server/src/security-manager.ts`): `importSecret(hex)`, `encryptStream(text)`, `decryptStream(packet)`
- **Replay protection**: packets carry a counter in the header; the server rejects old or out-of-order packets
- **Tamper-resistant**: bit flips in transit produce garbled plaintext

## Quick Start

```bash
git clone https://github.com/rspurgin/chatclaw.git
cd chatclaw
```

### Development (two terminals)

```bash
# Terminal 1 — server
cd server
npm ci
cp .env.example .env        # edit HMAC_SECRET_HEX
npm run dev

# Terminal 2 — client
cd client
npm ci
npm run dev
```

### Production (single process)

```bash
# Build client into server/public
cd client && npm ci && npm run build && cp -r dist ../server/public

# Run server (serves API + client)
cd ../server && npm ci && npm run build
PORT=3001 HMAC_SECRET_HEX=your_key_here node dist/index.js
```

### Docker

```bash
docker build -t chatclaw .
docker run -p 3001:3001 -e HMAC_SECRET_HEX=your_key_here chatclaw
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Server listen port |
| `HMAC_SECRET_HEX` | Yes | — | Shared secret for HMAC-OTP cipher (hex string) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin (lock down in production) |

## Tests

```bash
cd server && npm test
cd client && npm test
```
