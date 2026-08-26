import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

import { antiSpam } from './middleware/security.js';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const MAX_JSON_SIZE = '210mb';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_SIZE }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Maintenance mode check
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/public')) return next();
  try {
    const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get() as any;
    if (setting?.value === '1') {
      const userId = (req as any).userId;
      if (userId) {
        const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(userId) as any;
        if (admin?.is_admin) return next();
      }
      return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
    }
  } catch {}
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sitemap
app.get('/sitemap.xml', (_req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  const profiles = db.prepare('SELECT username, updated_at FROM profiles WHERE is_active = 1 ORDER BY updated_at DESC').all() as any[];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url><loc>https://kio.lol/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
  for (const p of profiles) {
    xml += `  <url><loc>https://kio.lol/@${p.username}</loc><lastmod>${p.updated_at || ''}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  xml += '</urlset>';
  res.send(xml);
});

// Robots.txt
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
