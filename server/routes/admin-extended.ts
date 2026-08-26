import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

function requireAdmin(req: AuthRequest, res: any): boolean {
  const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalProfiles = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as any;
    const activeProfiles = db.prepare('SELECT COUNT(*) as count FROM profiles WHERE is_active = 1').get() as any;
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM profiles').get() as any;
    const totalLinks = db.prepare('SELECT COUNT(*) as count FROM links').get() as any;
    const activeLinks = db.prepare('SELECT COUNT(*) as count FROM links WHERE is_active = 1').get() as any;
    const totalClicks = db.prepare('SELECT COALESCE(SUM(click_count), 0) as total FROM links').get() as any;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get() as any;
    const totalBadges = db.prepare('SELECT COUNT(*) as count FROM user_badges').get() as any;
    const recentUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").get() as any;

    res.json({
      totalUsers: totalUsers?.count || 0,
      totalProfiles: totalProfiles?.count || 0,
      activeProfiles: activeProfiles?.count || 0,
      totalViews: totalViews?.total || 0,
      totalLinks: totalLinks?.count || 0,
      activeLinks: activeLinks?.count || 0,
      totalClicks: totalClicks?.total || 0,
      pendingReports: pendingReports?.count || 0,
      totalBadges: totalBadges?.count || 0,
      recentUsers: recentUsers?.count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit-logs', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any;
    const logs = db.prepare(
      'SELECT al.*, p.username FROM audit_logs al LEFT JOIN profiles p ON al.user_id = p.user_id ORDER BY al.created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    res.json({
      logs,
      pagination: { page, limit, total: total?.count || 0, pages: Math.ceil((total?.count || 0) / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/announcements', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { title, content, type, expires_at } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const id = uuid();
    db.prepare('INSERT INTO announcements (id, title, content, type, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, title, content, type || 'info', req.userId, expires_at || null
    );

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    res.json(announcement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/announcements', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const announcements = db.prepare(
      "SELECT * FROM announcements WHERE is_active = 1 AND (expires_at IS NULL OR expires_at >= datetime('now')) ORDER BY created_at DESC"
    ).all();
    res.json(announcements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/announcements/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff-notes', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { target_user_id, note } = req.body;
    if (!target_user_id || !note) return res.status(400).json({ error: 'Target user and note required' });

    const id = uuid();
    db.prepare('INSERT INTO staff_notes (id, target_user_id, author_id, note) VALUES (?, ?, ?, ?)').run(
      id, target_user_id, req.userId, note
    );

    const staffNote = db.prepare('SELECT * FROM staff_notes WHERE id = ?').get(id);
    res.json(staffNote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/staff-notes/:userId', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const notes = db.prepare(
      'SELECT sn.*, p.username as author_name FROM staff_notes sn LEFT JOIN profiles p ON sn.author_id = p.user_id WHERE sn.target_user_id = ? ORDER BY sn.created_at DESC'
    ).all(req.params.userId);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/maintenance', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { enabled } = req.body;
    const setting = db.prepare('SELECT * FROM system_settings WHERE key = ?').get('maintenance_mode') as any;

    if (setting) {
      db.prepare("UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = ?").run(enabled ? '1' : '0', 'maintenance_mode');
    } else {
      db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', enabled ? '1' : '0');
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, details, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'maintenance_toggle', 'system', `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`, ip
    );

    res.json({ ok: true, maintenance: enabled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const dbPath = path.join(__dirname, '..', '..', 'data.db');
    let dbSize = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    } catch {}

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      uptime: Math.floor(uptime),
      dbSize,
      dbSizeFormatted: `${(dbSize / (1024 * 1024)).toFixed(2)} MB`,
      memory: {
        rss: `${(memUsage.rss / (1024 * 1024)).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / (1024 * 1024)).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / (1024 * 1024)).toFixed(2)} MB`,
      },
      nodeVersion: process.version,
      platform: process.platform,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feature-profile/:profileId', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.profileId) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const newFeatured = profile.featured ? 0 : 1;
    db.prepare('UPDATE profiles SET featured = ? WHERE id = ?').run(newFeatured, req.params.profileId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'feature_profile', 'profile', req.params.profileId,
      `Profile ${newFeatured ? 'featured' : 'unfeatured'}: ${profile.username}`, ip
    );

    res.json({ ok: true, featured: !!newFeatured });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
