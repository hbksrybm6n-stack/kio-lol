import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import linkRoutes from './routes/links.js';
import socialRoutes from './routes/socials.js';
import badgeRoutes from './routes/badges.js';
import templateRoutes from './routes/templates.js';
import analyticsRoutes from './routes/analytics.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import discordRoutes from './routes/discord.js';
import leaderboardRoutes from './routes/leaderboard.js';
import accountRoutes from './routes/account.js';
import discoveryRoutes from './routes/discovery.js';
import adminExtendedRoutes from './routes/admin-extended.js';
import legalRoutes from './routes/legal.js';
import publicRoutes from './routes/public.js';
import moderationRoutes from './routes/moderation.js';
import notificationRoutes from './routes/notifications.js';
import publicApiRoutes from './routes/public-api.js';
import captchaRoutes from './routes/captcha.js';
import premiumRoutes from './routes/premium.js';

import { antiSpam, bruteForceProtection } from './middleware/security.js';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const MAX_JSON_SIZE = '210mb';

function sanitizeInput(text: any): any {
  if (typeof text === 'string') {
    return text.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(text)) {
    return text.map(sanitizeInput);
  }
  if (text && typeof text === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(text)) {
      cleaned[key] = sanitizeInput(val);
    }
    return cleaned;
  }
  return text;
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://open.spotify.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_SIZE }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Slow down.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.use((req: any, _res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }
  }
  next();
});

app.use(bruteForceProtection);
app.use(antiSpam);

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/public')) return next();
  try {
    const setting = await db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get() as any;
    if (setting?.value === '1') {
      const userId = (req as any).userId;
      if (userId) {
        const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(userId) as any;
        if (admin?.is_admin) return next();
      }
      return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
    }
  } catch {}
  next();
});

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

app.get('/api/csrf-token', (_req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const id = crypto.randomBytes(16).toString('hex');
  csrfTokens.set(id, { token, expiresAt: Date.now() + 60 * 60 * 1000 });
  res.json({ csrfToken: token, csrfId: id });
});

app.use((req: any, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/csrf-token') && !req.path.startsWith('/api/health')) {
      const token = req.headers['x-csrf-token'];
      const csrfId = req.headers['x-csrf-id'];
      if (token && csrfId) {
        const stored = csrfTokens.get(csrfId);
        if (!stored || stored.token !== token || stored.expiresAt <= Date.now()) {
          csrfTokens.delete(csrfId);
          return res.status(403).json({ error: 'Invalid or expired CSRF token' });
        }
        csrfTokens.delete(csrfId);
      }
    }
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/socials', socialRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/admin-extended', adminExtendedRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public-api', publicApiRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/premium', premiumRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/sitemap.xml', async (_req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  const profiles = await db.prepare('SELECT username, updated_at FROM profiles WHERE is_active = 1 ORDER BY updated_at DESC').all() as any[];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url><loc>https://kio.lol/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
  for (const p of profiles) {
    xml += `  <url><loc>https://kio.lol/@${p.username}</loc><lastmod>${p.updated_at || ''}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  xml += '</urlset>';
  res.send(xml);
});

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard/\nDisallow: /admin\nSitemap: https://kio.lol/sitemap.xml');
});

app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

export { app };
