# chatclaw
ChatClaw is a lightweight “info exchange” companion for OpenClaw:

- **Client (Vite)**: simple UI that connects to the server
- **Server (Express + Socket.IO)**: relays **chat messages** and **shared data** to all connected clients and logs activity

Right now it’s a small real-time hub you can run locally (e.g., phone ↔︎ Mac Mini) to pass messages/payloads between devices.

### Security (HMAC-OTP)

The server includes a **stateful HMAC-OTP stream cipher** for secure phone-to-Mac Mini traffic. It uses the Web Crypto API (`crypto.subtle`) so the same code runs on Node and in browsers/React Native.

- **`SecurityManager`** (`server/src/security-manager.ts`): `importSecret(hex)`, `encryptStream(text)`, `decryptStream(packet)`
- **Replay protection**: packets carry a counter in the header; the server rejects old or out-of-order packets
- **Tamper-resistant**: bit flips in transit produce garbled plaintext

The cipher is wired up as a module; integrate it with your client/server messaging when you’re ready to encrypt the stream.

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
