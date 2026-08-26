import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.json([]);
  const links = db.prepare('SELECT * FROM links WHERE profile_id = ? ORDER BY sort_order ASC').all(profile.id);
  res.json(links);
});

router.get('/profile/:profileId', (req, res) => {
  const links = db.prepare("SELECT * FROM links WHERE profile_id = ? AND is_active = 1 AND visibility = 'public' ORDER BY sort_order ASC").all(req.params.profileId);

  const now = new Date().toISOString();
  const filtered = (links as any[]).filter((link) => {
    if (link.scheduled_at && link.scheduled_at > now) return false;
    if (link.scheduled_end && link.scheduled_end < now) return false;
    return true;
  });

  res.json(filtered);
});

router.get('/groups', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.json([]);
    const groups = db.prepare('SELECT * FROM link_groups WHERE profile_id = ? ORDER BY sort_order ASC').all(profile.id);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/groups', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { name, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const id = uuid();
    db.prepare('INSERT INTO link_groups (id, profile_id, name, sort_order) VALUES (?, ?, ?, ?)').run(
      id, profile.id, name, sort_order ?? 0
    );

    const group = db.prepare('SELECT * FROM link_groups WHERE id = ?').get(id);
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/groups/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const group = db.prepare('SELECT * FROM link_groups WHERE id = ? AND profile_id = ?').get(req.params.id, profile.id) as any;
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const fields = ['name', 'sort_order', 'is_visible'];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(f === 'is_visible' ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE link_groups SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM link_groups WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/groups/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    db.prepare('DELETE FROM link_groups WHERE id = ? AND profile_id = ?').run(req.params.id, profile.id);
    db.prepare("UPDATE links SET group_id = '' WHERE group_id = ? AND profile_id = ?").run(req.params.id, profile.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/groups/reorder', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { groups } = req.body;
    if (!Array.isArray(groups)) return res.status(400).json({ error: 'groups array required' });

    const stmt = db.prepare('UPDATE link_groups SET sort_order = ? WHERE id = ? AND profile_id = ?');
    const reorder = db.transaction((items: { id: string; sort_order: number }[]) => {
      for (const g of items) stmt.run(g.sort_order, g.id, profile.id);
    });
    reorder(groups);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const { title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active, group_id, thumbnail_url, scheduled_at, scheduled_end, visibility, target, open_animation } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
    const id = uuid();
    db.prepare(`INSERT INTO links (id, profile_id, title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active, group_id, thumbnail_url, scheduled_at, scheduled_end, visibility, target, open_animation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, profile.id, title, url, description || '', icon || '', color || '#8b5cf6',
      background_color || 'transparent', hover_color || '', animation || 'none',
      sort_order ?? 0, is_active !== undefined ? (is_active ? 1 : 0) : 1,
      group_id || '', thumbnail_url || '', scheduled_at || '', scheduled_end || '',
      visibility || 'public', target || '_blank', open_animation || 'none'
    );
    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
    res.json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const link = db.prepare('SELECT * FROM links WHERE id = ? AND profile_id = ?').get(req.params.id, profile.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const fields = ['title', 'url', 'description', 'icon', 'color', 'background_color', 'hover_color', 'animation', 'sort_order', 'is_active', 'group_id', 'thumbnail_url', 'scheduled_at', 'scheduled_end', 'visibility', 'target', 'open_animation'];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(f === 'is_active' ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  db.prepare('DELETE FROM links WHERE id = ? AND profile_id = ?').run(req.params.id, profile.id);
  res.json({ ok: true });
});

router.post('/reorder', authMiddleware, (req: AuthRequest, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) return res.status(400).json({ error: 'links array required' });
  const stmt = db.prepare('UPDATE links SET sort_order = ? WHERE id = ?');
  const reorder = db.transaction((items: { id: string; sort_order: number }[]) => {
    for (const l of items) stmt.run(l.sort_order, l.id);
  });
  reorder(links);
  res.json({ ok: true });
});

router.post('/:id/click', (req, res) => {
  try {
    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id) as any;
    if (!link) return res.json({ ok: true });

    const now = new Date().toISOString();
    if (link.scheduled_at && link.scheduled_at > now) return res.json({ ok: true });
    if (link.scheduled_end && link.scheduled_end < now) return res.json({ ok: true });

    db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(req.params.id);
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`INSERT INTO daily_stats (id, profile_id, date, link_clicks) VALUES (?, ?, ?, 1)
      ON CONFLICT(profile_id, date) DO UPDATE SET link_clicks = link_clicks + 1`).run(uuid(), link.profile_id, today);

    const userAgent = String(req.headers['user-agent'] || '');
    let deviceType = '';
    let browser = '';
    let os = '';

    try {
      const UAParser = (await import('ua-parser-js')).default;
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const browserInfo = parser.getBrowser();
      const osInfo = parser.getOS();
      deviceType = device.type || 'desktop';
      browser = browserInfo.name || '';
      os = osInfo.name || '';
    } catch {}

    db.prepare('INSERT INTO analytics (id, profile_id, event_type, link_id, visitor_agent, referer, device_type, browser, os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), link.profile_id, 'click', req.params.id, userAgent, String(req.headers['referer'] || ''), deviceType, browser, os
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

export default router;
