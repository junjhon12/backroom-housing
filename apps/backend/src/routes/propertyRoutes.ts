import { Router } from 'express';
import { getProperties, getPropertyById, createProperty } from '../controllers/propertyController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Route: /api/properties
router.route('/')
  .get(getProperties)
  // Protect the POST route: Must be logged in AND be a host or admin
  .post(protect, authorize('host', 'admin'), createProperty);

// Route: /api/properties/:id
router.route('/:id')
  .get(getPropertyById);

export default router;