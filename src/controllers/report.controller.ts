// Report Controller - Handle user and listing reports

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Create report
export const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { targetType, targetId, reason, description } = req.body;

        // Validate target type
        if (!['USER', 'LISTING'].includes(targetType)) {
            return res.status(400).json({ error: 'Invalid target type' });
        }

        // Check if target exists
        if (targetType === 'USER') {
            const user = await prisma.user.findUnique({ where: { id: targetId } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
        } else {
            const listing = await prisma.listing.findUnique({ where: { id: targetId } });
            if (!listing) {
                return res.status(404).json({ error: 'Listing not found' });
            }
        }

        // Create report
        const report = await prisma.report.create({
            data: {
                reporterId: userId!,
                targetType,
                targetId,
                reason,
                description,
                status: 'PENDING'
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(report);
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
};

// Get all reports (Admin only)
export const getAllReports = async (req: Request, res: Response) => {
    try {
        const { status, targetType } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (targetType) where.targetType = targetType;

        const reports = await prisma.report.findMany({
            where,
            include: {
                reporter: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
};

// Update report status (Admin only)
export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const report = await prisma.report.update({
            where: { id },
            data: {
                status,
                adminNotes
            }
        });

        res.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};

// Get user's reports
export const getUserReports = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const reports = await prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reports);
    } catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
};
