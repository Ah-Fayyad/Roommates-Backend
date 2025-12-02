import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const addFavorite = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.params;
        const favorite = await prisma.favorite.create({
            data: {
                userId: req.user.id,
                listingId,
            },
        });
        res.status(201).json(favorite);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.params;
        await prisma.favorite.deleteMany({
            where: {
                userId: req.user.id,
                listingId,
            },
        });
        res.json({ message: 'Favorite removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFavorites = async (req: AuthRequest, res: Response) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user.id },
            include: { listing: { include: { images: true } } },
        });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
