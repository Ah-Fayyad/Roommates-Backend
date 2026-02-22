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

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const [totalUsers, activeListings, messagesCount, visitsCount] = await Promise.all([
            prisma.user.count(),
            prisma.listing.count({ where: { status: 'ACTIVE' } }),
            prisma.message.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }), // Messages today
            prisma.visitRequest.count(),
        ]);

        res.json({
            totalUsers,
            activeListings,
            messagesCount,
            matchesCount: visitsCount // Using visits as a proxy since Match isn't a separate model
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching stats' });
    }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isVerified: true,
                isBanned: true,
                createdAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        const reports = await prisma.report.findMany({
            where: { status: 'PENDING' },
            include: {
                reporter: { select: { fullName: true } },
                reportedUser: { select: { fullName: true } },
                reportedListing: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
    try {
        const activities = await prisma.adminAction.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: { select: { fullName: true } },
            }
        });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching activity' });
    }
};

export const banUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot ban yourself' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: true },
        });

        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                actionType: 'BAN_USER',
                targetId: userId,
                reason: req.body.reason || 'Admin action',
            },
        });

        res.json({ message: 'User banned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error banning user' });
    }
};

export const unbanUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: false },
        });

        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                actionType: 'UNBAN_USER',
                targetId: userId,
                reason: 'Admin unbanned user',
            },
        });

        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error unbanning user' });
    }
};

export const verifyUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });
        res.json({ message: 'User verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error verifying user' });
    }
};

export const unverifyUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: false },
        });
        res.json({ message: 'User unverfied' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
