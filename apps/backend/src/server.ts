import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import propertyRoutes from './routes/propertyRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Enforce environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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

// Expose the 'uploads' directory to the public
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, 'uploads')));

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

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[Error]: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[Server] Backend listening on port ${PORT}`);
});