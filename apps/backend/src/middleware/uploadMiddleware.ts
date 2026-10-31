import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UPLOADS_DIR } from '../config/paths';
import { AppError } from '../utils/AppError';

// Ensure the destination exists: a fresh clone has no uploads/ directory and
// multer does not create it, which made the first upload fail with ENOENT.
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = /^\.(jpe?g|png|webp)$/i;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Configure local disk storage
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    // A random suffix keeps two uploads in the same millisecond from
    // overwriting each other and stops clients choosing predictable names.
    cb(null, `image-${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

// First-pass validation of the declared type. The real check happens after the
// file is written, by inspecting its magic bytes (see utils/imageSignature).
const checkFileType = (file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extname = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));
  const mimetype = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // Must be an AppError so the central handler returns 400, not 500.
    cb(new AppError(400, 'Images only (jpg, jpeg, png, webp)!'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    checkFileType(file, cb);
  },
});
