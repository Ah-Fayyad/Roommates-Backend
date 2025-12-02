// Visit Request Routes

import express from 'express';
import {
    createVisitRequest,
    getVisitRequests,
    acceptVisitRequest,
    declineVisitRequest,
    completeVisit
} from '../controllers/visit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/request', authenticate, createVisitRequest);
router.get('/', authenticate, getVisitRequests);
router.post('/:id/accept', authenticate, acceptVisitRequest);
router.post('/:id/decline', authenticate, declineVisitRequest);
router.post('/:id/complete', authenticate, completeVisit);

export default router;
