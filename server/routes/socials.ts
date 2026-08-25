import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.json([]);
  const socials = db.prepare('SELECT * FROM social_links WHERE profile_id = ? ORDER BY sort_order ASC').all(profile.id);
  res.json(socials);
});

router.get('/profile/:profileId', (req, res) => {
  const socials = db.prepare('SELECT * FROM social_links WHERE profile_id = ? ORDER BY sort_order ASC').all(req.params.profileId);
  res.json(socials);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const { platform, url, username, color } = req.body;
  if (!platform || !url) return res.status(400).json({ error: 'Platform and URL required' });
  const id = uuid();
  db.prepare('INSERT INTO social_links (id, profile_id, platform, url, username, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, profile.id, platform, url, username || '', color || '#8b5cf6',
    (db.prepare('SELECT COUNT(*) as c FROM social_links WHERE profile_id = ?').get(profile.id) as any).c
  );
  res.json(db.prepare('SELECT * FROM social_links WHERE id = ?').get(id));
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const fields = ['platform', 'url', 'username', 'color', 'is_active'];
  const updates: string[] = [];
  const values: any[] = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(f === 'is_active' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE social_links SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json(db.prepare('SELECT * FROM social_links WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM social_links WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
