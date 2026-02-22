import express from 'express';
import {
    getModerationQueue,
    approveListing,
    rejectListing,
    getDashboardStats,
    getUsers,
    getReports,
    getRecentActivity,
    banUser,
    unbanUser,
    verifyUser,
    unverifyUser
} from '../controllers/admin.controller';
import { getAllReports } from '../controllers/report.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/moderation', getModerationQueue);
router.post('/approve-listing', approveListing);
router.post('/reject-listing', rejectListing);
router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/reports', getAllReports);
router.get('/activity', getRecentActivity);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);
router.post('/users/:userId/verify', verifyUser);
router.post('/users/:userId/unverify', unverifyUser);

export default router;
