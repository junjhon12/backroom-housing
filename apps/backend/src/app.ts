import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Expose the 'uploads' directory to the public
app.use('/uploads', express.static(UPLOADS_DIR));

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
}

app.get('/api/health', (req: Request, res: Response<HealthCheckResponse>): void => {
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'Backroom Housing API',
  });
});

// Unknown routes and thrown errors both resolve to the same JSON shape.
app.use(notFound);
app.use(errorHandler);

export default app;
