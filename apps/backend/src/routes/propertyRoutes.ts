import { Router } from 'express';
import { getProperties, createProperty } from '../controllers/propertyController';

const router = Router();

// Route: /api/properties
router.route('/')
  .get(getProperties)
  .post(createProperty);

export default router;