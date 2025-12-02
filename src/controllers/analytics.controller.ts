// Analytics Controller - Track listing views and statistics

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Track listing view
export const trackListingView = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.params;
        const userId = req.user?.id || null;
        const sessionId = req.cookies?.sessionId || crypto.randomUUID();
        const ipHash = crypto.createHash('sha256').update(req.ip || '').digest('hex');
        const userAgent = req.headers['user-agent'] || '';

        // Create view record
        await prisma.listingView.create({
            data: {
                listingId,
                viewerId: userId,
                sessionId,
                ipHash,
                userAgent
            }
        });

        // Increment view count
        await prisma.listing.update({
            where: { id: listingId },
            data: {
                viewsCount: {
                    increment: 1
                }
            }
        });

        // Set session cookie if not exists
        if (!req.cookies?.sessionId) {
            res.cookie('sessionId', sessionId, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: true
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Track view error:', error);
        res.status(500).json({ error: 'Failed to track view' });
    }
};

// Get listing statistics
export const getListingStats = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.params;
        const userId = req.user?.id;

        // Verify ownership
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true }
        });

        if (!listing || listing.ownerId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Get view statistics
        const totalViews = await prisma.listingView.count({
            where: { listingId }
        });

        const uniqueViewers = await prisma.listingView.groupBy({
            by: ['viewerId'],
            where: {
                listingId,
                viewerId: { not: null }
            }
        });

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentViews = await prisma.listingView.count({
            where: {
                listingId,
                timestamp: { gte: last7Days }
            }
        });

        // Get views by day
        const viewsByDay = await prisma.$queryRaw`
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM "ListingView"
            WHERE "listingId" = ${listingId}
            AND timestamp >= ${last7Days}
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        `;

        res.json({
            totalViews,
            uniqueViewers: uniqueViewers.length,
            recentViews,
            viewsByDay
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
};

// Track map click
export const trackMapClick = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId } = req.params;
        const userId = req.user?.id;

        // Log map click (you can create a separate table or use admin actions)
        console.log(`Map clicked for listing ${listingId} by user ${userId}`);

        // Get listing coordinates
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { latitude: true, longitude: true }
        });

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Return Google Maps URL
        const mapsUrl = `https://maps.google.com?q=${listing.latitude},${listing.longitude}`;

        res.json({ url: mapsUrl });
    } catch (error) {
        console.error('Track map click error:', error);
        res.status(500).json({ error: 'Failed to track map click' });
    }
};
