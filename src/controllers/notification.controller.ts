// Notification Controller

import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Get user notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { unreadOnly } = req.query;

        const where: any = { userId };
        if (unreadOnly === 'true') {
            where.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Mark all as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Create notification (internal use)
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                type: type as NotificationType,
                title,
                message,
                data
            }
        });
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.notification.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
