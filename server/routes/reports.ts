import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  const { reporter_id, reported_profile_id, reason, description } = req.body;
  if (!reported_profile_id || !reason) return res.status(400).json({ error: 'Required fields missing' });
  const id = uuid();
  await db.prepare('INSERT INTO reports (id, reporter_id, reported_profile_id, reason, description) VALUES (?, ?, ?, ?, ?)').run(
    id, reporter_id || null, reported_profile_id, reason, description || ''
  );
  res.json({ ok: true });
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const reports = await db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  res.json(reports);
});

router.put('/:id/resolve', authMiddleware, async (req: AuthRequest, res) => {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  await db.prepare("UPDATE reports SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?").run(req.userId, req.params.id);
  res.json({ ok: true });
});

export default router;
