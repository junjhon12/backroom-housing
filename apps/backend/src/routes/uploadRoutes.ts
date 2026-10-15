import { Router, Request, Response } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Route: POST /api/upload
// Requires auth, role validation, and expects a single file in the 'image' form field
router.post('/', protect, authorize('host', 'admin'), upload.single('image'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file was uploaded' });
    return;
  }
  
  // Normalize Windows backslashes to forward slashes for standard URL paths
  const normalizedPath = req.file.path.replace(/\\/g, '/');
  
  res.status(200).json({ 
    success: true, 
    data: `/${normalizedPath}` // Returns e.g., "/uploads/image-12345.jpg"
  });
});

export default router;