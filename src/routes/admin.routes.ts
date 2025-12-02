import express from 'express';
import { getModerationQueue, approveListing, rejectListing } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

router.use(authenticate, isAdmin);
router.get('/moderation', getModerationQueue);
router.post('/approve-listing', approveListing);
router.post('/reject-listing', rejectListing);

export default router;
