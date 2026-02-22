// Real-time Socket.io Events Handler

import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../utils/jwt";

interface UserSocket {
  userId: string;
  socketId: string;
}

const onlineUsers = new Map<string, string>(); // userId -> socketId

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const initializeSocket = (httpServer: HTTPServer) => {
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
        // Validate required fields
        if (!chatId || !toUserId) {
          console.error("Invalid message data:", { chatId, toUserId });
          socket.emit("message_error", { error: "Invalid chat or user ID" });
          return;
        }

        // Determine if delivered (receiver online)
        const isDelivered = onlineUsers.has(toUserId);

        // Save message to database
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

        // Emit to sender (confirmation)
        socket.emit("message_sent", messagePayload);

        // Emit to receiver (new message)
        io.to(`user:${toUserId}`).emit("new_message", messagePayload);

        console.log(
          `✅ Message sent from ${userId} to ${toUserId}: ${isDelivered ? "delivered" : "queued"}`,
        );

        // Update user last active
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

        // Notify the sender that their messages were read
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: true },
        });

        if (chat) {
          const otherParticipant = chat.participants.find(
            (p) => p.id !== userId,
          );
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

    // Handle chat opened
    socket.on("chat_opened", ({ chatId, otherUserId }) => {
      socket.join(`chat:${chatId}`);
      io.to(`user:${otherUserId}`).emit("chat_opened", {
        chatId,
        userId,
      });
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

    // Handle visit response
    socket.on("visit_response", ({ requestId, requesterId, status }) => {
      io.to(`user:${requesterId}`).emit("visit_response", {
        requestId,
        status,
        timestamp: new Date(),
      });
    });

    // Handle notification
    socket.on("send_notification", ({ toUserId, type, data }) => {
      io.to(`user:${toUserId}`).emit("notification", {
        type,
        data,
        timestamp: new Date(),
      });
    });

    // Handle disconnect
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

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
