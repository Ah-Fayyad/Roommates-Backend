// Report Routes

import express from 'express';
import {
    createReport,
    getAllReports,
    updateReportStatus,
    getUserReports
} from '../controllers/report.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createReport);
router.get('/my-reports', authenticate, getUserReports);
router.get('/all', authenticate, requireAdmin, getAllReports);
router.patch('/:id', authenticate, requireAdmin, updateReportStatus);

export default router;
