// Analytics Routes

import express from 'express';
import {
    trackListingView,
    getListingStats,
    trackMapClick
} from '../controllers/analytics.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/listings/:listingId/view', optionalAuth, trackListingView);
router.get('/listings/:listingId/stats', authenticate, getListingStats);
router.get('/listings/:listingId/map', optionalAuth, trackMapClick);

export default router;
