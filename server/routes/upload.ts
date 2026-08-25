import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const MAX_UPLOAD_SIZE = 200 * 1024 * 1024; // 200 MB

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

['avatars', 'banners', 'links'].forEach(d => ensureDir(path.join(uploadDir, d)));

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const type = file.fieldname === 'avatar' ? 'avatars' : file.fieldname === 'banner' ? 'banners' : 'links';
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
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter,
});

const router = Router();

router.post('/', authMiddleware, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const type = req.file.fieldname === 'avatar' ? 'avatars' : req.file.fieldname === 'banner' ? 'banners' : 'links';
  const url = `/uploads/${type}/${req.file.filename}`;
  res.json({ url, size: req.file.size, type: req.file.fieldname });
});

router.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File is too large. Maximum file size is ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes('not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Upload failed' });
});

export { MAX_UPLOAD_SIZE };
export default router;
