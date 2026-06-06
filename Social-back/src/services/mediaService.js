import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AppError } from '../utils/appError.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED = new Map([
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/png', ['png']],
  ['image/webp', ['webp']],
  ['video/mp4', ['mp4']],
]);

const BANNED_EXT = new Set(['js', 'html', 'htm', 'exe', 'sh', 'php', 'ps1', 'bat']);

const safeFileName = (ext) => `${crypto.randomUUID()}-${Date.now()}.${ext}`;

export const uploadMedia = async (file) => {
  if (!file || !file.buffer) {
    throw new AppError(400, { error: 'No file uploaded' });
  }

  const buffer = file.buffer;
  if (buffer.length === 0) {
    throw new AppError(400, { error: 'Empty file' });
  }

  const { fileTypeFromBuffer } = await import('file-type');
  const type = await fileTypeFromBuffer(buffer);
  if (!type) {
    throw new AppError(400, { error: 'Unsupported or unrecognized file type' });
  }

  const { mime, ext } = type;
  if (BANNED_EXT.has(ext)) {
    throw new AppError(400, { error: 'Unsupported file type' });
  }

  if (!ALLOWED.has(mime)) {
    throw new AppError(400, { error: 'Unsupported file type' });
  }

  const allowedExts = ALLOWED.get(mime) || [];
  const chosenExt = allowedExts.includes(ext) ? ext : allowedExts[0] || ext;
  const filename = safeFileName(chosenExt);
  const outPath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.promises.writeFile(outPath, buffer, { flag: 'wx' });
  } catch (error) {
    throw new AppError(500, { error: 'Failed to save file' });
  }

  return {
    filename,
    mimetype: mime,
    size: buffer.length,
    url: `/uploads/${filename}`,
  };
};

export default {
  uploadMedia,
};
