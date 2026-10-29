import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { UPLOADS_DIR } from './config/paths';
import propertyRoutes from './routes/propertyRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';

// Environment variables are read lazily (at connect/request time), so loading
// them here — before start() runs — is sufficient. The explicit path keeps this
// working regardless of which directory the process was launched from.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Enforce strict CORS policies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Mount routers
app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Expose the 'uploads' directory to the public
app.use('/uploads', express.static(UPLOADS_DIR));

// Explicit interface definition for API response payloads
interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response<HealthCheckResponse>): void => {
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'Backroom Housing API'
  });
});

// Unknown routes and thrown errors both resolve to the same JSON shape.
app.use(notFound);
app.use(errorHandler);

const start = async (): Promise<void> => {
  // Wait for the connection before accepting traffic so requests can't arrive
  // while Mongoose is still buffering commands.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Backend listening on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});
