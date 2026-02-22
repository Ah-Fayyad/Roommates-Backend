import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

import { analyzeMatchCompatibility } from '../services/ai.service';

export const getMatches = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const userPreferences = await prisma.preference.findUnique({ where: { userId }, include: { user: true } });

        if (!userPreferences) {
            return res.status(400).json({ message: 'Please set your preferences first' });
        }

        const potentialMatches = await prisma.user.findMany({
            where: {
                id: { not: userId },
                preferences: { isNot: null },
            },
            include: { preferences: true },
        });

        const scoredMatches = await Promise.all(potentialMatches.map(async (match) => {
            const analysis = await analyzeMatchCompatibility(userPreferences, match.preferences);
            return {
                user: {
                    id: match.id,
                    fullName: match.fullName,
                    avatar: match.avatar,
                    university: match.university,
                    bio: match.bio,
                    isVerified: match.isVerified
                },
                score: analysis.score,
                insights: analysis.insights
            };
        }));

        scoredMatches.sort((a, b) => b.score - a.score);
        res.json(scoredMatches);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
