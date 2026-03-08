import { io } from 'socket.io-client';

// For local development, assuming server runs on 3001
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
});
