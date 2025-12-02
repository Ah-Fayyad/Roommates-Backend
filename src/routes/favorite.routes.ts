import express from 'express';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.get('/', getFavorites);
router.post('/:listingId', addFavorite);
router.delete('/:listingId', removeFavorite);

export default router;
