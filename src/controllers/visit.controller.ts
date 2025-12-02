// Visit Request Controller

import { Request, Response } from 'express';
import { PrismaClient, VisitStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Create visit request
export const createVisitRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { listingId, proposedTimes, message } = req.body;

        // Get listing owner
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true }
        });

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Create visit request
        const visitRequest = await prisma.visitRequest.create({
            data: {
                listingId,
                requesterId: userId!,
                ownerId: listing.ownerId,
                proposedTimes,
                message,
                status: VisitStatus.REQUESTED
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true
                    }
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        address: true
                    }
                }
            }
        });

        res.status(201).json(visitRequest);
    } catch (error) {
        console.error('Create visit request error:', error);
        res.status(500).json({ error: 'Failed to create visit request' });
    }
};

// Get user's visit requests
export const getVisitRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { type } = req.query; // 'sent' or 'received'

        const where = type === 'sent'
            ? { requesterId: userId }
            : { ownerId: userId };

        const visitRequests = await prisma.visitRequest.findMany({
            where,
            include: {
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true
                    }
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        images: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(visitRequests);
    } catch (error) {
        console.error('Get visit requests error:', error);
        res.status(500).json({ error: 'Failed to get visit requests' });
    }
};

// Accept visit request
export const acceptVisitRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { scheduledTime } = req.body;

        // Verify ownership
        const visitRequest = await prisma.visitRequest.findUnique({
            where: { id }
        });

        if (!visitRequest) {
            return res.status(404).json({ error: 'Visit request not found' });
        }

        if (visitRequest.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Update status
        const updated = await prisma.visitRequest.update({
            where: { id },
            data: {
                status: VisitStatus.ACCEPTED,
                scheduledTime: scheduledTime ? new Date(scheduledTime) : null
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                listing: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Accept visit request error:', error);
        res.status(500).json({ error: 'Failed to accept visit request' });
    }
};

// Decline visit request
export const declineVisitRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { reason } = req.body;

        // Verify ownership
        const visitRequest = await prisma.visitRequest.findUnique({
            where: { id }
        });

        if (!visitRequest) {
            return res.status(404).json({ error: 'Visit request not found' });
        }

        if (visitRequest.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Update status
        const updated = await prisma.visitRequest.update({
            where: { id },
            data: {
                status: VisitStatus.DECLINED,
                declineReason: reason
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Decline visit request error:', error);
        res.status(500).json({ error: 'Failed to decline visit request' });
    }
};

// Complete visit
export const completeVisit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { notes, rating } = req.body;

        const visitRequest = await prisma.visitRequest.findUnique({
            where: { id }
        });

        if (!visitRequest) {
            return res.status(404).json({ error: 'Visit request not found' });
        }

        if (visitRequest.requesterId !== userId && visitRequest.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.visitRequest.update({
            where: { id },
            data: {
                status: VisitStatus.COMPLETED,
                completedAt: new Date(),
                notes,
                rating
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Complete visit error:', error);
        res.status(500).json({ error: 'Failed to complete visit' });
    }
};
