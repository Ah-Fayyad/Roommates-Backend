import app from './app';
import http from 'http';
import dotenv from 'dotenv';
import { initializeSocket } from './socket/socket.handler';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io with full event handlers
const io = initializeSocket(server);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for real-time connections`);
});

export { io };

