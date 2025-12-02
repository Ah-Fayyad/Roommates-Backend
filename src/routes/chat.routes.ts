import express from 'express';
import { getChats, getMessages } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.get('/', getChats);
router.get('/:chatId/messages', getMessages);

export default router;
