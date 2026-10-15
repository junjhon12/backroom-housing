import { Router } from 'express';
import { 
  getProperties, 
  getPropertyById, 
  createProperty,
  updateProperty,
  deleteProperty, 
  getPropertiesByHost
} from '../controllers/propertyController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('host', 'admin'), createProperty);

// MUST go before /:id to prevent "me" from being parsed as an ObjectId
router.route('/me')
  .get(protect, authorize('host', 'admin'), getPropertiesByHost);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('host', 'admin'), updateProperty)
  .delete(protect, authorize('host', 'admin'), deleteProperty);

export default router;