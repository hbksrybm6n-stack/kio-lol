import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.json([]);
  const links = await db.prepare('SELECT * FROM links WHERE profile_id = ? ORDER BY sort_order ASC').all(profile.id);
  res.json(links);
});

router.get('/profile/:profileId', async (req, res) => {
  const links = await db.prepare("SELECT * FROM links WHERE profile_id = ? AND is_active = 1 AND visibility = 'public' ORDER BY sort_order ASC").all(req.params.profileId);

  const now = new Date().toISOString();
  const filtered = (links as any[]).filter((link) => {
    if (link.scheduled_at && link.scheduled_at > now) return false;
    if (link.scheduled_end && link.scheduled_end < now) return false;
    if (link.expiration && link.expiration < now) return false;
    return true;
  }).map((link) => {
    if (link.password && link.password !== '') {
      return {
        ...link,
        url: undefined,
        requires_password: true,
        embed_html: link.embed_html || '',
      };
    }
    return {
      ...link,
      requires_password: false,
      embed_html: link.embed_html || '',
    };
  });

  res.json(filtered);
});

router.get('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.json([]);
    const groups = await db.prepare('SELECT * FROM link_groups WHERE profile_id = ? ORDER BY sort_order ASC').all(profile.id);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { name, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const id = uuid();
    await db.prepare('INSERT INTO link_groups (id, profile_id, name, sort_order) VALUES (?, ?, ?, ?)').run(
      id, profile.id, name, sort_order ?? 0
    );

    const group = await db.prepare('SELECT * FROM link_groups WHERE id = ?').get(id);
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const group = await db.prepare('SELECT * FROM link_groups WHERE id = ? AND profile_id = ?').get(req.params.id, profile.id) as any;
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
      await db.prepare(`UPDATE link_groups SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = await db.prepare('SELECT * FROM link_groups WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await db.prepare('DELETE FROM link_groups WHERE id = ? AND profile_id = ?').run(req.params.id, profile.id);
    await db.prepare("UPDATE links SET group_id = '' WHERE group_id = ? AND profile_id = ?").run(req.params.id, profile.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/groups/reorder', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { groups } = req.body;
    if (!Array.isArray(groups)) return res.status(400).json({ error: 'groups array required' });

    const stmt = db.prepare('UPDATE link_groups SET sort_order = ? WHERE id = ? AND profile_id = ?');
    const reorder = db.transaction(async (dbTx: any) => {
      for (const g of groups) await stmt.run(g.sort_order, g.id, profile.id);
    });
    await reorder();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const { title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active, group_id, thumbnail_url, scheduled_at, scheduled_end, visibility, target, open_animation, password, expiration, redirect_url, embed_html } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
    const id = uuid();

    let passwordHash = '';
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    await db.prepare(`INSERT INTO links (id, profile_id, title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active, group_id, thumbnail_url, scheduled_at, scheduled_end, visibility, target, open_animation, password, expiration, redirect_url, embed_html)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, profile.id, title, url, description || '', icon || '', color || '#8b5cf6',
      background_color || 'transparent', hover_color || '', animation || 'none',
      sort_order ?? 0, is_active !== undefined ? (is_active ? 1 : 0) : 1,
      group_id || '', thumbnail_url || '', scheduled_at || '', scheduled_end || '',
      visibility || 'public', target || '_blank', open_animation || 'none',
      passwordHash, expiration || '', redirect_url || '', embed_html || ''
    );
    const link = await db.prepare('SELECT * FROM links WHERE id = ?').get(id);
    res.json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const link = await db.prepare('SELECT * FROM links WHERE id = ? AND profile_id = ?').get(req.params.id, profile.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const fields = ['title', 'url', 'description', 'icon', 'color', 'background_color', 'hover_color', 'animation', 'sort_order', 'is_active', 'group_id', 'thumbnail_url', 'scheduled_at', 'scheduled_end', 'visibility', 'target', 'open_animation', 'expiration', 'redirect_url', 'embed_html'];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(f === 'is_active' ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }

    if (req.body.password !== undefined) {
      if (req.body.password === '' || req.body.password === null) {
        updates.push("password = ''");
      } else {
        updates.push('password = ?');
        values.push(bcrypt.hashSync(req.body.password, 10));
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      await db.prepare(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = await db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  await db.prepare('DELETE FROM links WHERE id = ? AND profile_id = ?').run(req.params.id, profile.id);
  res.json({ ok: true });
});

router.post('/reorder', authMiddleware, async (req: AuthRequest, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) return res.status(400).json({ error: 'links array required' });
  const stmt = db.prepare('UPDATE links SET sort_order = ? WHERE id = ?');
  const reorder = db.transaction(async (dbTx: any) => {
    for (const l of links) await stmt.run(l.sort_order, l.id);
  });
  await reorder();
  res.json({ ok: true });
});

router.post('/:id/unlock', async (req, res) => {
  try {
    const link = await db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id) as any;
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (!link.password) return res.json({ url: link.url });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const valid = bcrypt.compareSync(password, link.password);
    if (!valid) return res.status(403).json({ error: 'Invalid password' });

    res.json({ url: link.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/r/:id', async (req, res) => {
  try {
    const link = await db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id) as any;
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const now = new Date().toISOString();
    if (link.expiration && link.expiration < now) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    await db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(req.params.id);
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(`INSERT INTO daily_stats (id, profile_id, date, link_clicks) VALUES (?, ?, ?, 1)
      ON CONFLICT(profile_id, date) DO UPDATE SET link_clicks = link_clicks + 1`).run(uuid(), link.profile_id, today);

    const userAgent = String(req.headers['user-agent'] || '');
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
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

    await db.prepare('INSERT INTO analytics (id, profile_id, event_type, link_id, visitor_agent, visitor_ip, referer, device_type, browser, os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), link.profile_id, 'click', req.params.id, userAgent, ip, String(req.headers['referer'] || ''), deviceType, browser, os
    );

    const redirectUrl = link.redirect_url || link.url;
    res.redirect(302, redirectUrl);
  } catch {
    res.status(500).json({ error: 'Redirect failed' });
  }
});

router.post('/:id/click', async (req, res) => {
  try {
    const link = await db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id) as any;
    if (!link) return res.json({ ok: true });

    const now = new Date().toISOString();
    if (link.scheduled_at && link.scheduled_at > now) return res.json({ ok: true });
    if (link.scheduled_end && link.scheduled_end < now) return res.json({ ok: true });
    if (link.expiration && link.expiration < now) return res.json({ ok: true });

    await db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(req.params.id);
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(`INSERT INTO daily_stats (id, profile_id, date, link_clicks) VALUES (?, ?, ?, 1)
      ON CONFLICT(profile_id, date) DO UPDATE SET link_clicks = link_clicks + 1`).run(uuid(), link.profile_id, today);

    const userAgent = String(req.headers['user-agent'] || '');
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
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

    await db.prepare('INSERT INTO analytics (id, profile_id, event_type, link_id, visitor_agent, visitor_ip, referer, device_type, browser, os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), link.profile_id, 'click', req.params.id, userAgent, String(req.headers['referer'] || ''), ip, deviceType, browser, os
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

export default router;
