import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import routes from './routes.js';
import { appendToLog } from './logger.js';
const app = express();
const server = http.createServer(app);
// Enable CORS for Vite client
app.use(cors({
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST']
}));
// Setup API routes
app.use('/api', routes);
// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // When a chat message is received from a client
    socket.on('chat_message', (msgData) => {
        // 1. Log it
        appendToLog(`[CHAT] ${msgData}`);
        // 2. Broadcast it to ALL clients (including sender)
        io.emit('chat_message', msgData);
    });
    // When arbitrary data is shared from a client
    socket.on('share_data', (dataPayload) => {
        // 1. Log it
        appendToLog(`[DATA] Shared Payload: ${dataPayload}`);
        // 2. Broadcast the data to ALL clients
        io.emit('share_data', dataPayload);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Open Claw Chat Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map