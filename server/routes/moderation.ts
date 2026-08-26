import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/report', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { reported_profile_id, reason, description, category, link_id } = req.body;
    if (!reported_profile_id || !reason) return res.status(400).json({ error: 'Required fields missing' });

    const reporterProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!reporterProfile) return res.status(400).json({ error: 'Profile required to report' });

    const id = uuid();
    db.prepare('INSERT INTO profile_reports (id, reporter_profile_id, reported_profile_id, reason, description, category) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, reporterProfile.id, reported_profile_id, reason, description || '', category || 'other'
    );

    if (link_id) {
      const reportActionId = uuid();
      db.prepare('INSERT INTO report_actions (id, report_id, action_by, action, notes) VALUES (?, ?, ?, ?, ?)').run(
        reportActionId, id, req.userId, 'link_reported', `Reported link: ${link_id}`
      );
    }

    res.json({ ok: true, reportId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/block/:userId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const blockerProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!blockerProfile) return res.status(400).json({ error: 'Profile required' });

    const blockedProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (!blockedProfile) return res.status(404).json({ error: 'User not found' });

    if (blockerProfile.id === blockedProfile.id) return res.status(400).json({ error: 'Cannot block yourself' });

    try {
      db.prepare('INSERT INTO blocked_users (id, blocker_id, blocked_id) VALUES (?, ?, ?)').run(
        uuid(), blockerProfile.id, blockedProfile.id
      );
    } catch {
      return res.status(400).json({ error: 'Already blocked' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/block/:userId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const blockerProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!blockerProfile) return res.status(400).json({ error: 'Profile required' });

    const blockedProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (!blockedProfile) return res.status(404).json({ error: 'User not found' });

    db.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').run(blockerProfile.id, blockedProfile.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/blocked', authMiddleware, (req: AuthRequest, res) => {
  try {
    const blockerProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!blockerProfile) return res.json([]);

    const blocked = db.prepare(`
      SELECT bu.id, bu.created_at, p.id as profile_id, p.username, p.display_name, p.avatar_url
      FROM blocked_users bu
      JOIN profiles p ON bu.blocked_id = p.id
      WHERE bu.blocker_id = ?
      ORDER BY bu.created_at DESC
    `).all(blockerProfile.id);

    res.json(blocked);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appeal', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });

    const id = uuid();
    db.prepare('INSERT INTO appeals (id, user_id, reason, description) VALUES (?, ?, ?, ?)').run(
      id, req.userId, reason, description || ''
    );

    res.json({ ok: true, appealId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/appeals', authMiddleware, (req: AuthRequest, res) => {
  try {
    const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const appeals = db.prepare(
      'SELECT a.*, u.email, p.username FROM appeals a JOIN users u ON a.user_id = u.id LEFT JOIN profiles p ON a.user_id = p.user_id ORDER BY a.created_at DESC'
    ).all();
    res.json(appeals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
