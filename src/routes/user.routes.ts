import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, updateSettings, deleteAccount, requestVerification, getVisits } from '../controllers/user.controller';

const router = express.Router();

// Get current user (for auth context)
router.get('/me', authenticate, getProfile);

// Get user profile
router.get('/profile', authenticate, getProfile);

// Update user profile
router.put('/profile', authenticate, updateProfile);

// Update user settings
router.put('/settings', authenticate, updateSettings);

// Request verification
router.post('/verify', authenticate, requestVerification);

// Get visits
router.get('/visits', authenticate, getVisits);

// Delete user account
router.delete('/account', authenticate, deleteAccount);

export default router;
