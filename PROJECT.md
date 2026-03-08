# ChatClaw

A real-time chat and data sharing application optimized for Open Claw usage.
Built by the Global Brain agent according to defined user preferences.

## Tech Stack
*   **Language:** TypeScript / Node.js
*   **Frontend:** React, Vite, Tailwind CSS (Atomic Design)
*   **Backend:** Express, Socket.io
*   **Git Strategy:** Feature branches (`feat/*`)

## Project Structure
- `/client`: The frontend Vite React application. Connected to the backend via WebSocket.
- `/server`: The Express Node.js backend. Hosts real-time socket events and provides an endpoint to serve the log file.
- `PROJECT.md`: (This file) Project context reference for AI consumption.

## Features
- Real-time chat messaging using WebSockets.
- File-system logging on the server (`data.log`).
- API endpoint to fetch and view server logs from the frontend client.
