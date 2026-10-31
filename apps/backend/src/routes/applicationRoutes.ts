import { Router } from 'express';
import {
  createApplication,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  withdrawApplication,
} from '../controllers/applicationController';
import { authorize, protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/').post(protect, createApplication);

// Static paths must stay above /:id routes.
router.get('/mine', protect, getMyApplications);
router.get('/received', protect, authorize('host', 'admin'), getReceivedApplications);

router.patch('/:id/status', protect, authorize('host', 'admin'), updateApplicationStatus);
router.patch('/:id/withdraw', protect, withdrawApplication);

export default router;
