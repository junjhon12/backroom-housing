import { Router } from 'express';
import { 
  getProperties, 
  getPropertyById, 
  createProperty,
  updateProperty,
  deleteProperty 
} from '../controllers/propertyController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('host', 'admin'), createProperty);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('host', 'admin'), updateProperty)
  .delete(protect, authorize('host', 'admin'), deleteProperty);

export default router;