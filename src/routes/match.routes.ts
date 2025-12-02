import express from 'express';
import { getMatches } from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.get('/', getMatches);

export default router;
