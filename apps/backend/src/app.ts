import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { UPLOADS_DIR } from './config/paths';
import propertyRoutes from './routes/propertyRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';

// Loaded here rather than in server.ts: CORS reads FRONTEND_URL while this
// module is evaluated, which happens before the entry point's body runs.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Kept separate from server.ts so integration tests can mount the API without
// opening a port or sharing the development database connection.
const app = express();

const isTest = process.env.NODE_ENV === 'test';

if (process.env.NODE_ENV === 'production') {
  // Required for rate limiting to see the real client IP behind a proxy.
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    // Listing photographs are intentionally public and may be served from a
    // different origin in a split frontend/API deployment.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// A listing payload is small; refusing oversized bodies early limits the work
// an unauthenticated client can make the server do.
app.use(express.json({ limit: '100kb' }));

const rateLimitMessage = {
  success: false,
  error: 'Too many requests. Please try again later.',
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 100_000 : 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitMessage,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 100_000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitMessage,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTest ? 100_000 : 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitMessage,
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/users', userRoutes);

// Expose the 'uploads' directory to the public
app.use('/uploads', express.static(UPLOADS_DIR));

interface HealthCheckResponse {
  status: 'operational' | 'degraded';
  database: 'connected' | 'disconnected';
  timestamp: string;
  service: string;
}

app.get('/api/health', (req: Request, res: Response<HealthCheckResponse>): void => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? 'operational' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'Backroom Housing API',
  });
});

// Unknown routes and thrown errors both resolve to the same JSON shape.
app.use(notFound);
app.use(errorHandler);

export default app;
