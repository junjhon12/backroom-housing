import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { isValidImageFile } from '../utils/imageSignature';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import type { ApiResponse } from '../types/api';

const router = Router();

// Route: POST /api/upload
// Requires auth, role validation, and expects a single file in the 'image' form field
router.post(
  '/',
  protect,
  authorize('host', 'admin'),
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response<ApiResponse<string>>): Promise<void> => {
    if (!req.file) {
      throw new AppError(400, 'No file was uploaded');
    }

    // The extension and mimetype are client-controlled, so verify the actual
    // file signature before keeping anything on disk.
    if (!(await isValidImageFile(req.file.path))) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      throw new AppError(400, 'Uploaded file is not a valid image');
    }

    // Return a public URL rather than a filesystem path.
    res.status(200).json({
      success: true,
      data: `/uploads/${path.basename(req.file.path)}`,
    });
  })
);

export default router;
