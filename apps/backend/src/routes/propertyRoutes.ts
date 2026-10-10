import { Router } from 'express';
import { getProperties, getPropertyById, createProperty } from '../controllers/propertyController';

const router = Router();

// Route: /api/properties
router.route('/')
  .get(getProperties)
  .post(createProperty);

// Route: /api/properties/:id
router.route('/:id')
  .get(getPropertyById);

export default router;