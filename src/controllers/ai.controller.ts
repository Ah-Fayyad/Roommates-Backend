import { Request, Response } from 'express';
import { generateAIResponse, providePriceAdvice, analyzeMatchCompatibility, parseSearchQuery, analyzeRoomImage } from '../services/ai.service';

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const response = await generateAIResponse(message, conversationHistory);
        res.json(response);
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

export const getPriceAdvice = async (req: Request, res: Response) => {
    try {
        const { price, area, amenities } = req.body;
        const advice = await providePriceAdvice(price, area, amenities);
        res.json(advice);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getMatchAnalysis = async (req: Request, res: Response) => {
    try {
        const { userPrefs, matchPrefs } = req.body;
        const analysis = await analyzeMatchCompatibility(userPrefs, matchPrefs);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getSemanticSearch = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        const filters = await parseSearchQuery(query as string);
        res.json({ filters });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getImageDescription = async (req: Request, res: Response) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
        const description = await analyzeRoomImage(imageUrl);
        res.json({ description });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
