import express from 'express';
import { chatWithAI, getPriceAdvice, getMatchAnalysis, getSemanticSearch, getImageDescription } from '../controllers/ai.controller';

const router = express.Router();

router.post('/chat', chatWithAI);
router.post('/price-advice', getPriceAdvice);
router.post('/match-analysis', getMatchAnalysis);
router.get('/semantic-search', getSemanticSearch);
router.post('/analyze-image', getImageDescription);

export default router;
