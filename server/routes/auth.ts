import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { JWT_SECRET, authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash);

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.json({ message: 'If the email exists, a reset link has been sent' });

    const token = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(uuid(), user.id, token, expiresAt);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;

    if (user) {
      const token = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(uuid(), user.id, token, expiresAt);
    }

    res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password-token', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const resetToken = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token) as any;
    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, resetToken.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId) as any;
  res.json({ user, profile });
});

export default router;
