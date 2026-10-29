import path from 'path';

// Resolve from the package root rather than process.cwd() so uploads are read
// and written to the same place no matter which directory the process starts in.
export const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
