import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, updateSettings, deleteAccount } from '../controllers/user.controller';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, getProfile);

// Update user profile
router.put('/profile', authenticate, updateProfile);

// Update user settings
router.put('/settings', authenticate, updateSettings);

// Delete user account
router.delete('/account', authenticate, deleteAccount);

export default router;
