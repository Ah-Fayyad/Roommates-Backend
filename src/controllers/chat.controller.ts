import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getChats = async (req: AuthRequest, res: Response) => {
    try {
        const chats = await prisma.chat.findMany({
            where: {
                participants: {
                    some: { id: req.user.id },
                },
            },
            include: {
                participants: {
                    where: { id: { not: req.user.id } },
                    select: { id: true, fullName: true, avatar: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { chatId } = req.params;
        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, fullName: true, avatar: true } } },
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
