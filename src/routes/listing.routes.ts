import express from 'express';
import { createListing, getListings, getListingById, updateListing, deleteListing } from '../controllers/listing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateListing } from '../middleware/validation.middleware';

const router = express.Router();

router.get('/', getListings);
router.get('/:id', getListingById);

router.use(authenticate);
router.post('/', validateListing, createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

export default router;
