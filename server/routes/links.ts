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

// Get links by profile id
router.get('/profile/:profileId', (req, res) => {
  const links = db.prepare('SELECT * FROM links WHERE profile_id = ? ORDER BY sort_order ASC').all(req.params.profileId);
  res.json(links);
});

// Create link
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const { title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
    const id = uuid();
    db.prepare(`INSERT INTO links (id, profile_id, title, url, description, icon, color, background_color, hover_color, animation, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, profile.id, title, url, description || '', icon || '', color || '#8b5cf6',
      background_color || 'transparent', hover_color || '', animation || 'none',
      sort_order ?? 0, is_active !== undefined ? (is_active ? 1 : 0) : 1
    );
    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
    res.json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update link
router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const link = db.prepare('SELECT * FROM links WHERE id = ? AND profile_id = ?').get(req.params.id, profile.id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const fields = ['title', 'url', 'description', 'icon', 'color', 'background_color', 'hover_color', 'animation', 'sort_order', 'is_active'];
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

// Delete link
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  db.prepare('DELETE FROM links WHERE id = ? AND profile_id = ?').run(req.params.id, profile.id);
  res.json({ ok: true });
});

// Reorder links
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

// Track link click
router.post('/:id/click', (req, res) => {
  try {
    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id) as any;
    if (!link) return res.json({ ok: true });
    db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?').run(req.params.id);
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`INSERT INTO daily_stats (id, profile_id, date, link_clicks) VALUES (?, ?, ?, 1)
      ON CONFLICT(profile_id, date) DO UPDATE SET link_clicks = link_clicks + 1`).run(uuid(), link.profile_id, today);
    db.prepare('INSERT INTO analytics (id, profile_id, event_type, link_id, visitor_agent, referer) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuid(), link.profile_id, 'click', req.params.id, String(req.headers['user-agent'] || ''), String(req.headers['referer'] || '')
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

export default router;
