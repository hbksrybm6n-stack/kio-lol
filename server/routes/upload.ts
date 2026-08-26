import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const thumbDir = path.join(uploadDir, 'thumbs');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3',
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|webp|mp4|webm|mov|mp3|ogg|wav)$/i;

const BLOCKED_EXTENSIONS = /\.(exe|bat|cmd|com|msi|scr|pif|vbs|js|jar|php|py|rb|sh|bat|cmd|com|dll|sys|cpl|lnk|inf|reg|regsvr32)$/i;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

['avatars', 'banners', 'links', 'music', 'thumbs'].forEach(d => ensureDir(path.join(uploadDir, d)));

function getMaxSize(fieldname: string): number {
  switch (fieldname) {
    case 'avatar': return 5 * 1024 * 1024;
    case 'banner': return 10 * 1024 * 1024;
    case 'music': return 200 * 1024 * 1024;
    default: return 20 * 1024 * 1024;
  }
}

function getUploadDir(fieldname: string): string {
  switch (fieldname) {
    case 'avatar': return 'avatars';
    case 'banner': return 'banners';
    case 'music': return 'music';
    default: return 'links';
  }
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const type = getUploadDir(file.fieldname);
    cb(null, path.join(uploadDir, type));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (BLOCKED_EXTENSIONS.test(file.originalname)) {
    return cb(new Error('File type not allowed'));
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.test(file.originalname)) {
    return cb(new Error('File type not allowed. Supported: JPEG, PNG, GIF, WebP, MP4, WebM, MP3, OGG, WAV'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter,
});

const router = Router();

router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fieldname = req.file.fieldname;
  const maxSize = getMaxSize(fieldname);
  if (req.file.size > maxSize) {
    fs.unlinkSync(req.file.path);
    return res.status(413).json({ error: `File too large. Maximum size for ${fieldname} is ${maxSize / (1024 * 1024)} MB` });
  }

  const type = getUploadDir(fieldname);
  const url = `/uploads/${type}/${req.file.filename}`;
  let thumbUrl = '';

  const imageExts = /\.(jpe?g|png|gif|webp)$/i;
  if (imageExts.test(req.file.filename) && fieldname !== 'music') {
    try {
      const thumbFilename = `thumb-${req.file.filename}`;
      const thumbPath = path.join(thumbDir, thumbFilename);
      await sharp(req.file.path)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      thumbUrl = `/uploads/thumbs/${thumbFilename}`;
    } catch {}
  }

  res.json({ url, thumbUrl, size: req.file.size, type: fieldname });
});

router.delete('/:filename', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { filename } = req.params;
    const type = req.query.type as string || 'links';
    const validTypes = ['avatars', 'banners', 'links', 'music'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const filePath = path.join(uploadDir, type, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const url = `/uploads/${type}/${filename}`;
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (profile) {
      const isOwner =
        db.prepare('SELECT id FROM profiles WHERE user_id = ? AND avatar_url = ?').get(req.userId!, url) ||
        db.prepare('SELECT id FROM profiles WHERE user_id = ? AND banner_url = ?').get(req.userId!, url) ||
        db.prepare('SELECT id FROM links WHERE profile_id = ? AND (url = ? OR thumbnail_url = ?)').get(profile.id, url, url);
      if (!isOwner && type !== 'links') {
        return res.status(403).json({ error: 'You can only delete your own files' });
      }
    }

    fs.unlinkSync(filePath);

    const thumbPath = path.join(thumbDir, `thumb-${filename}`);
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes('not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Upload failed' });
});

export default router;
