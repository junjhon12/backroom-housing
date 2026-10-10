import { Router } from 'express';
import { registerUser } from '../controllers/authController';

const router = Router();

// Route: /api/auth/register
router.route('/register').post(registerUser);

export default router;