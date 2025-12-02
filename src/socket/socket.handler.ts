// Real-time Socket.io Events Handler

import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';

interface UserSocket {
    userId: string;
    socketId: string;
}

const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (httpServer: HTTPServer) => {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5176',
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = verifyToken(token);
            socket.data.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        console.log(`User connected: ${userId}`);

        // Store online user
        onlineUsers.set(userId, socket.id);

        // Broadcast user online status
        io.emit('user_online', { userId });

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Handle typing events
        socket.on('typing_start', ({ chatId, toUserId }) => {
            io.to(`user:${toUserId}`).emit('user_typing', {
                chatId,
                userId,
                isTyping: true
            });
        });

        socket.on('typing_stop', ({ chatId, toUserId }) => {
            io.to(`user:${toUserId}`).emit('user_typing', {
                chatId,
                userId,
                isTyping: false
            });
        });

        // Handle new message
        socket.on('send_message', async (data) => {
            const { chatId, toUserId, body, attachments } = data;

            try {
                // Save message to database (you'll implement this)
                const message = {
                    id: Date.now().toString(),
                    chatId,
                    fromUserId: userId,
                    toUserId,
                    body,
                    attachments: attachments || [],
                    status: 'sent',
                    createdAt: new Date()
                };

                // Emit to sender (confirmation)
                socket.emit('message_sent', message);

                // Emit to receiver
                io.to(`user:${toUserId}`).emit('new_message', message);

                // Update message status to delivered if user is online
                if (onlineUsers.has(toUserId)) {
                    setTimeout(() => {
                        io.to(`user:${userId}`).emit('message_delivered', {
                            messageId: message.id,
                            chatId
                        });
                    }, 100);
                }
            } catch (error) {
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Handle message read
        socket.on('mark_read', ({ chatId, messageIds }) => {
            // Update database
            // Emit to sender
            socket.broadcast.to(`chat:${chatId}`).emit('messages_read', {
                chatId,
                messageIds,
                readBy: userId
            });
        });

        // Handle chat opened
        socket.on('chat_opened', ({ chatId, otherUserId }) => {
            socket.join(`chat:${chatId}`);
            io.to(`user:${otherUserId}`).emit('chat_opened', {
                chatId,
                userId
            });
        });

        // Handle visit request
        socket.on('visit_request', ({ listingId, ownerId, proposedTimes }) => {
            io.to(`user:${ownerId}`).emit('new_visit_request', {
                listingId,
                requesterId: userId,
                proposedTimes,
                timestamp: new Date()
            });
        });

        // Handle visit response
        socket.on('visit_response', ({ requestId, requesterId, status }) => {
            io.to(`user:${requesterId}`).emit('visit_response', {
                requestId,
                status,
                timestamp: new Date()
            });
        });

        // Handle notification
        socket.on('send_notification', ({ toUserId, type, data }) => {
            io.to(`user:${toUserId}`).emit('notification', {
                type,
                data,
                timestamp: new Date()
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
            onlineUsers.delete(userId);
            io.emit('user_offline', { userId });
        });
    });

    return io;
};

export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};
