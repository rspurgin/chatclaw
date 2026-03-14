import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";
import routes from "./routes.js";
import { appendToLog } from "./logger.js";
import { config } from "./config.js";
import type { ServerToClientEvents, ClientToServerEvents } from "./events.js";

export function createApp(): {
  app: express.Express;
  server: http.Server;
  io: Server<ClientToServerEvents, ServerToClientEvents>;
} {
  const app = express();
  const server = http.createServer(app);

  app.use(cors({ origin: config.corsOrigin, methods: ["GET", "POST"] }));
  app.use("/api", routes);

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: config.corsOrigin, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.info(`[socket] connected: ${socket.id}`);

    socket.on("chat_message", (msg) => {
      void appendToLog(`[CHAT] ${msg}`);
      io.emit("chat_message", msg);
    });

    socket.on("share_data", (payload) => {
      void appendToLog(`[DATA] Shared Payload: ${payload}`);
      io.emit("share_data", payload);
    });

    socket.on("disconnect", () => {
      console.info(`[socket] disconnected: ${socket.id}`);
    });
  });

  return { app, server, io };
}
