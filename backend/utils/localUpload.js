import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { cloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const uploadsRoot = path.join(backendRoot, 'uploads');
const listingsUploadDir = path.join(uploadsRoot, 'listings');

export const ensureUploadsDir = () => {
  if (!fs.existsSync(listingsUploadDir)) {
    fs.mkdirSync(listingsUploadDir, { recursive: true });
  }
};

const sanitizeFileName = (name) =>
  String(name || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, listingsUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const baseName = path.basename(file.originalname || 'image', extension);
    const safeBaseName = sanitizeFileName(baseName) || 'image';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeBaseName}${extension}`);
  },
});

export const buildImagePayload = (file) => ({
  url: file.secure_url || file.path,
  public_id: file.filename || file.public_id || null,
});

export const extractPublicIdFromUrl = (value) => {
  if (!value) return null;

  const decodedValue = decodeURIComponent(String(value));

  if (decodedValue.startsWith('listings/')) {
    return decodedValue;
  }

  try {
    const parsedUrl = new URL(decodedValue);
    const marker = '/upload/';
    const index = parsedUrl.pathname.indexOf(marker);
    if (index >= 0) {
      return parsedUrl.pathname
        .slice(index + marker.length)
        .replace(/^v\d+\//, '')
        .replace(/\.[^.]+$/, '');
    }
  } catch {
    // Standard string operations as fallback
  }

  const normalized = decodedValue.replace(/\\/g, '/');
  const uploadPathIndex = normalized.indexOf('/uploads/');
  if (uploadPathIndex >= 0) {
    return normalized.slice(uploadPathIndex + '/uploads/'.length).replace(/^\/+/, '');
  }

  return normalized.replace(/^\/+/, '');
};

export const deleteLocalImage = async (publicIdOrUrl) => {
  const publicId = extractPublicIdFromUrl(publicIdOrUrl);
  if (!publicId) return;

  if (String(publicIdOrUrl || '').includes('cloudinary.com')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('[Cloudinary Delete Error]:', err.message);
    }
    return;
  }

  const absolutePath = path.resolve(uploadsRoot, publicId);

  // حماية من Path Traversal: التأكد من أن الملف داخل uploadsRoot
  if (!absolutePath.startsWith(uploadsRoot)) {
    console.error('[Security Warning]: Unauthorized file deletion attempt blocked.');
    return;
  }

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('[Local File Delete Error]:', error.message);
    }
  }
};