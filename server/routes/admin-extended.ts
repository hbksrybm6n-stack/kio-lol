import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
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

router.delete('/users/:userId', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const profile = db.prepare('SELECT id, username FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'user_hard_deleted', 'user', req.params.userId,
      `User ${profile?.username || req.params.userId} hard deleted`, ip
    );

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId/deactivate', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    db.prepare('UPDATE profiles SET is_deactivated = 1 WHERE user_id = ?').run(req.params.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'user_deactivated', 'user', req.params.userId, 'User deactivated by admin', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId/reactivate', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    db.prepare('UPDATE profiles SET is_deactivated = 0 WHERE user_id = ?').run(req.params.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'user_reactivated', 'user', req.params.userId, 'User reactivated by admin', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId/username', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const existing = db.prepare('SELECT id FROM profiles WHERE username = ? AND user_id != ?').get(username, req.params.userId);
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const profile = db.prepare('SELECT id, username FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    db.prepare('UPDATE profiles SET username = ? WHERE user_id = ?').run(username, req.params.userId);

    db.prepare('INSERT INTO username_history (id, user_id, old_username, new_username) VALUES (?, ?, ?, ?)').run(
      uuid(), req.params.userId, profile.username, username
    );

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'admin_username_change', 'user', req.params.userId,
      `Admin changed username from ${profile.username} to ${username}`, ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId/email', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.userId);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, req.params.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'admin_email_change', 'user', req.params.userId,
      `Admin changed email to ${email}`, ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:userId/reset-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.userId);
    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(req.params.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'admin_password_reset', 'user', req.params.userId, 'Admin forced password reset', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:userId/sessions', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(req.params.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'admin_end_sessions', 'user', req.params.userId, 'Admin ended all user sessions', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:userId/login-history', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const history = db.prepare(
      'SELECT id, ip, user_agent, country, success, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.params.userId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:userId/reports', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (!profile) return res.json([]);

    const reports = db.prepare(
      'SELECT pr.*, p.username as reporter_username FROM profile_reports pr LEFT JOIN profiles p ON pr.reporter_profile_id = p.id WHERE pr.reported_profile_id = ? ORDER BY pr.created_at DESC'
    ).all(profile.id);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:userId/bans', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const profile = db.prepare('SELECT id, username FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (!profile) return res.json([]);

    const bans = db.prepare(
      `SELECT al.*, p.username as admin_username FROM audit_logs al LEFT JOIN profiles p ON al.user_id = p.user_id
       WHERE al.target_id = ? AND al.action IN ('user_banned', 'user_unbanned') ORDER BY al.created_at DESC`
    ).all(req.params.userId);
    res.json(bans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/global-settings', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const settings = db.prepare('SELECT * FROM system_settings').all();
    const settingsObj: Record<string, string> = {};
    for (const s of settings as any[]) {
      settingsObj[s.key] = s.value;
    }
    res.json(settingsObj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/global-settings', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings object required' });

    const upsert = db.prepare(
      "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
    );

    const upsertAll = db.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        upsert.run(key, String(value));
      }
    });
    upsertAll(Object.entries(settings));

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, details, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'global_settings_update', 'system', `Updated ${Object.keys(settings).join(', ')}`, ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/announcements/:id/pin', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id) as any;
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    const { pinned } = req.body;
    const existing = db.prepare("SELECT value FROM system_settings WHERE key = 'pinned_announcement'").get() as any;

    if (pinned) {
      if (existing) {
        db.prepare("UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = 'pinned_announcement'").run(req.params.id);
      } else {
        db.prepare("INSERT INTO system_settings (key, value) VALUES ('pinned_announcement', ?)").run(req.params.id);
      }
    } else {
      db.prepare("DELETE FROM system_settings WHERE key = 'pinned_announcement' AND value = ?").run(req.params.id);
    }

    res.json({ ok: true, pinned: !!pinned });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/announcements/schedule', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { title, content, type, start_time, end_time } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const id = uuid();
    db.prepare('INSERT INTO announcements (id, title, content, type, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, title, content, type || 'info', req.userId, end_time || null
    );

    if (start_time) {
      const settingKey = `scheduled_announcement_${id}`;
      db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run(
        settingKey, JSON.stringify({ start_time, end_time: end_time || null })
      );
    }

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    res.json(announcement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/premium-plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const plans = db.prepare('SELECT * FROM premium_plans ORDER BY price_monthly ASC').all();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/premium-plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { id, name, price_monthly, price_yearly, features } = req.body;
    const planId = id || uuid();
    db.prepare('INSERT OR REPLACE INTO premium_plans (id, name, price_monthly, price_yearly, features) VALUES (?, ?, ?, ?, ?)').run(planId, name, price_monthly || 0, price_yearly || 0, JSON.stringify(features || []));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId/premium', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { plan, until } = req.body;
    db.prepare('UPDATE profiles SET role = ?, premium_until = ? WHERE user_id = ?').run(plan || 'premium', until || '', req.params.userId);
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (profile) {
      try {
        db.prepare('INSERT OR IGNORE INTO user_badges (id, profile_id, badge_id) VALUES (?, ?, ?)').run(uuid(), profile.id, 'b6');
      } catch {}
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
