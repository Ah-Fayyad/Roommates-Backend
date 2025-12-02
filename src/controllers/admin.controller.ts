import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getModerationQueue = async (req: AuthRequest, res: Response) => {
    try {
        const listings = await prisma.listing.findMany({
            where: { status: 'INACTIVE' }, // Assuming new listings are inactive until approved or we use a separate status
            include: { owner: true, images: true },
        });

        const verifications = await prisma.verificationRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: true },
        });

        res.json({ listings, verifications });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const approveListing = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.body;
        await prisma.listing.update({
            where: { id: listingId },
            data: { status: 'ACTIVE' },
        });

        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                actionType: 'APPROVE_LISTING',
                targetId: listingId,
            },
        });

        res.json({ message: 'Listing approved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const rejectListing = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId, reason } = req.body;
        await prisma.listing.update({
            where: { id: listingId },
            data: { status: 'REJECTED' },
        });

        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                actionType: 'REJECT_LISTING',
                targetId: listingId,
                reason,
            },
        });

        res.json({ message: 'Listing rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
