import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, JWT_SECRET, type AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.put('/email', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) return res.status(400).json({ error: 'Email and current password required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid current password' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, req.userId);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, req.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'email_change', 'user', req.userId, `Email changed to ${newEmail}`, ip
    );

    res.json({ ok: true, email: newEmail });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid current password' });

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.userId);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'password_change', 'user', req.userId, 'Password changed', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/login-history', authMiddleware, (req: AuthRequest, res) => {
  try {
    const history = db.prepare(
      'SELECT id, ip, user_agent, country, success, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.userId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', authMiddleware, (req: AuthRequest, res) => {
  try {
    const sessions = db.prepare(
      'SELECT id, ip, user_agent, is_active, created_at, expires_at FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC'
    ).all(req.userId);
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE sessions SET is_active = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/revoke-all', authMiddleware, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(req.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/security', authMiddleware, (req: AuthRequest, res) => {
  try {
    const loginHistory = db.prepare(
      'SELECT id, ip, user_agent, country, success, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(req.userId);

    const activeSessions = db.prepare(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND is_active = 1'
    ).get(req.userId) as any;

    res.json({
      loginHistory,
      activeSessions: activeSessions?.count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
