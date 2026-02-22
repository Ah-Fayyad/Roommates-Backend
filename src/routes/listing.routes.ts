import express from 'express';
import { createListing, getListings, getListingById, updateListing, deleteListing, getUserListings } from '../controllers/listing.controller';
import { authenticate, requireLandlord } from '../middleware/auth.middleware';
import { validateListing } from '../middleware/validation.middleware';

const router = express.Router();

// Protected routes - require authentication
router.get('/my-listings', authenticate, requireLandlord, getUserListings);

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Landlord-only routes - require LANDLORD role
router.post('/', authenticate, requireLandlord, validateListing, createListing);
router.put('/:id', authenticate, requireLandlord, updateListing);
router.delete('/:id', authenticate, requireLandlord, deleteListing);

export default router;
