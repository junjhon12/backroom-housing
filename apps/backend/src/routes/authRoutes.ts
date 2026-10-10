import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';

const router = Router();

// Routes: /api/auth/*
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;