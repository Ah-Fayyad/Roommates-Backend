import { Request, Response } from 'express';
import { queryRAG } from './rag.service';

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const response = await queryRAG(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
