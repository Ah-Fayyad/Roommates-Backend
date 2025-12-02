import express from 'express';
import { chatWithAI } from '../chatbot/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.post('/chat', chatWithAI);

export default router;
