import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getMatches = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const userPreferences = await prisma.preference.findUnique({ where: { userId } });

        if (!userPreferences) {
            return res.status(400).json({ message: 'Please set your preferences first' });
        }

        // Simple matching algorithm
        // In a real app, this would be more complex and likely use a separate service or DB query optimization
        const potentialMatches = await prisma.user.findMany({
            where: {
                id: { not: userId },
                preferences: { isNot: null },
            },
            include: { preferences: true },
        });

        const scoredMatches = potentialMatches.map(match => {
            let score = 0;
            const p1 = userPreferences;
            const p2 = match.preferences!;

            // Cleanliness (30%)
            const cleanlinessDiff = Math.abs(p1.cleanliness - p2.cleanliness);
            score += (1 - cleanlinessDiff / 4) * 30;

            // Study Habits (25%)
            const studyDiff = Math.abs(p1.studyHabits - p2.studyHabits);
            score += (1 - studyDiff / 4) * 25;

            // Pets (20%)
            if (p1.pets === p2.pets) score += 20;

            // Budget (25%)
            // Simplified overlap check
            const overlap = Math.max(0, Math.min(p1.budgetMax, p2.budgetMax) - Math.max(p1.budgetMin, p2.budgetMin));
            if (overlap > 0) score += 25;

            return { user: match, score };
        });

        scoredMatches.sort((a, b) => b.score - a.score);

        res.json(scoredMatches);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
