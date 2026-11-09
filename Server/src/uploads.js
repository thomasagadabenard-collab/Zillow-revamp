import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from './config.js';

fs.mkdirSync(env.uploadDir, { recursive: true });
const allowed = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/avif', '.avif'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${allowed.get(file.mimetype) || '.img'}`),
});

export const propertyMediaUpload = multer({
  storage,
  limits: { fileSize: env.MAX_MEDIA_BYTES, files: env.MAX_MEDIA_FILES },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(Object.assign(new Error('Use JPEG, PNG, WEBP, or AVIF images, or MP4/WebM videos.'), { status: 400 }));
    cb(null, true);
  },
}).array('media', env.MAX_MEDIA_FILES);

export function mediaRecord(file, position) {
  return {
    name: path.basename(file.originalname).slice(0, 255),
    url: `${env.apiPublicUrl}/uploads/${path.basename(file.filename)}`,
    mediaType: file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    position,
  };
}

export const imageRecord = mediaRecord;

export function validateMediaFiles(files = []) {
  if (files.some((file) => file.mimetype.startsWith('image/') && file.size > env.MAX_IMAGE_BYTES)) {
    return `Each image must be no larger than ${Math.floor(env.MAX_IMAGE_BYTES / (1024 * 1024))} MB.`;
  }
  if (files.some((file) => file.mimetype.startsWith('video/') && file.size > env.MAX_MEDIA_BYTES)) {
    return `Each video must be no larger than ${Math.floor(env.MAX_MEDIA_BYTES / (1024 * 1024))} MB.`;
  }
  return '';
}

export function deleteLocalImage(url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(env.apiPublicUrl).origin) return;
    const filename = path.basename(parsed.pathname);
    const target = path.resolve(env.uploadDir, filename);
    if (path.dirname(target) === env.uploadDir) fs.rmSync(target, { force: true });
  } catch { /* ignore malformed or external image URLs */ }
}

export function deleteUploadedFiles(files = []) {
  for (const file of files) fs.rmSync(file.path, { force: true });
}
