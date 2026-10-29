import fs from 'fs';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Verify a file's magic bytes instead of trusting the client-supplied
 * extension and mimetype, both of which are trivial to spoof.
 *
 * Returns false rather than throwing so an unreadable file can never leave an
 * async route handler with an unhandled rejection.
 */
export const isValidImageFile = async (filePath: string): Promise<boolean> => {
  let handle: fs.promises.FileHandle | undefined;

  try {
    handle = await fs.promises.open(filePath, 'r');
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(12), 0, 12, 0);

    if (bytesRead < 12) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return true;

    // WebP: "RIFF" .... "WEBP"
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  } catch {
    return false;
  } finally {
    if (handle) {
      await handle.close().catch(() => {});
    }
  }
};
