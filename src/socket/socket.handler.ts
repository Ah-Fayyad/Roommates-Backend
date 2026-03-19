// Real-time Socket.io Events Handler

import { Server as SocketServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const onlineUsers = new Map<string, string>(); // userId -> socketId

let ioInstance: SocketServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  if (ioInstance) return ioInstance;

  const io = new SocketServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1000000,
  });

  ioInstance = io;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Store online user
    onlineUsers.set(userId, socket.id);

    // Broadcast user online status
    io.emit("user_online", { userId });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle typing events
    socket.on("typing_start", ({ chatId, toUserId }) => {
      io.to(`user:${toUserId}`).emit("user_typing", {
        chatId,
        userId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ chatId, toUserId }) => {
      io.to(`user:${toUserId}`).emit("user_typing", {
        chatId,
        userId,
        isTyping: false,
      });
    });

    // Handle new message
    socket.on("send_message", async (data) => {
      const { chatId, toUserId, content, type, imageUrl, tempId } = data;
      console.log(
        `[Socket] Message from ${userId} to ${toUserId} in chat ${chatId}`,
      );

      try {
        if (!chatId || !toUserId) {
          socket.emit("message_error", { error: "Invalid chat or user ID" });
          return;
        }

        const isDelivered = onlineUsers.has(toUserId);

        const dbMessage = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content: content || "",
            type: type || "TEXT",
            imageUrl: imageUrl || null,
            delivered: isDelivered,
            read: false,
          },
          include: {
            sender: { select: { fullName: true } }
          }
        });

        const notification = await prisma.notification.create({
          data: {
            userId: toUserId,
            type: "NEW_MESSAGE",
            title: "New Message",
            message: `${dbMessage.sender.fullName} sent you a message`,
            data: JSON.stringify({ chatId, senderId: userId }),
            read: false,
          }
        });

        const messagePayload = {
          id: dbMessage.id,
          tempId,
          chatId,
          senderId: userId,
          toUserId,
          content: dbMessage.content,
          type: dbMessage.type,
          imageUrl: dbMessage.imageUrl,
          createdAt: dbMessage.createdAt,
          delivered: isDelivered,
          read: false,
          status: isDelivered ? "delivered" : "sent",
        };

        socket.emit("message_sent", messagePayload);
        io.to(`user:${toUserId}`).emit("new_message", messagePayload);

        io.to(`user:${toUserId}`).emit("notification", {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: JSON.parse(notification.data || '{}'),
          createdAt: notification.createdAt,
          read: false,
        });

        await prisma.user.update({
          where: { id: userId },
          data: { lastActiveAt: new Date() },
        });
      } catch (error) {
        console.error("Socket send_message error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Handle message read
    socket.on("mark_read", async ({ chatId, messageIds }) => {
      try {
        await prisma.message.updateMany({
          where: { id: { in: messageIds } },
          data: { read: true },
        });

        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: true },
        });

        if (chat) {
          const otherParticipant = chat.participants.find((p) => p.id !== userId);
          if (otherParticipant) {
            io.to(`user:${otherParticipant.id}`).emit("messages_read", {
              chatId,
              messageIds,
              readBy: userId,
            });
          }
        }
      } catch (error) {
        console.error("Socket mark_read error:", error);
      }
    });

    // Handle visit request
    socket.on("visit_request", ({ listingId, ownerId, proposedTimes }) => {
      io.to(`user:${ownerId}`).emit("new_visit_request", {
        listingId,
        requesterId: userId,
        proposedTimes,
        timestamp: new Date(),
      });
    });

    // Handle logout/disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit("user_offline", { userId });

      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    });
  });

  return io;
};

export const getIO = () => ioInstance;

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
