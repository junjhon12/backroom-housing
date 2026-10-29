import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload, MAX_IMAGE_BYTES } from '../middleware/uploadMiddleware';
import { isValidImageFile } from '../utils/imageSignature';

const router = Router();

const maxMegabytes = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

// Route: POST /api/upload
// Requires auth, role validation, and expects a single file in the 'image' form field
router.post(
  '/',
  protect,
  authorize('host', 'admin'),
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file was uploaded' });
      return;
    }

    // The extension and mimetype are client-controlled, so verify the actual
    // file signature before keeping anything on disk.
    if (!(await isValidImageFile(req.file.path))) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(400).json({ success: false, error: 'Uploaded file is not a valid image' });
      return;
    }

    // Return a public URL rather than a filesystem path.
    res.status(200).json({
      success: true,
      data: `/uploads/${path.basename(req.file.path)}`,
    });
  }
);

// Multer reports its own failures (size limits, rejected types) via next(err).
// Translate them into a 400 JSON response instead of a generic 500.
router.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Image must be ${maxMegabytes}MB or smaller`
        : err.message;
    res.status(400).json({ success: false, error: message });
    return;
  }

  res.status(400).json({ success: false, error: err.message || 'Upload failed' });
});

export default router;
