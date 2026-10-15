import { Router } from 'express';
import { toggleFavorite, getFavorites } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Require authentication for all user-specific routes
router.use(protect);

// Routes: /api/users/*
router.route('/favorites')
  .get(getFavorites);

router.route('/favorites/:propertyId')
  .post(toggleFavorite);

export default router;