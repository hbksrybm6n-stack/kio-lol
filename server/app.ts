import express from 'express';
import cors from 'cors';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const MAX_JSON_SIZE = '210mb';

app.use(cors());
app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_SIZE }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

export { app };
