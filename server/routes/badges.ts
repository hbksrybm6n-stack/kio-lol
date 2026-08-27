import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM badges ORDER BY name').all());
});

router.get('/profile/:profileId', async (req, res) => {
  const badges = await db.prepare(`
    SELECT ub.id, ub.badge_id, ub.created_at, b.name, b.icon, b.color, b.description
    FROM user_badges ub JOIN badges b ON ub.badge_id = b.id
    WHERE ub.profile_id = ?
  `).all(req.params.profileId);
  res.json(badges);
});

router.get('/users', authMiddleware, async (req: AuthRequest, res) => {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const users = await db.prepare(`
    SELECT p.id, p.username, p.display_name, p.avatar_url,
      GROUP_CONCAT(ub.badge_id) as badge_ids
    FROM profiles p
    LEFT JOIN user_badges ub ON p.id = ub.profile_id
    GROUP BY p.id
    ORDER BY p.username
  `).all();

  res.json(users);
});

router.post('/assign', authMiddleware, async (req: AuthRequest, res) => {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { profile_id, badge_id } = req.body;
  if (!profile_id || !badge_id) return res.status(400).json({ error: 'profile_id and badge_id required' });
  try {
    await db.prepare('INSERT OR IGNORE INTO user_badges (id, profile_id, badge_id, awarded_by) VALUES (?, ?, ?, ?)').run(uuid(), profile_id, badge_id, req.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/remove', authMiddleware, async (req: AuthRequest, res) => {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { profile_id, badge_id } = req.body;
  if (!profile_id || !badge_id) return res.status(400).json({ error: 'profile_id and badge_id required' });
  await db.prepare('DELETE FROM user_badges WHERE profile_id = ? AND badge_id = ?').run(profile_id, badge_id);
  res.json({ ok: true });
});

export default router;
