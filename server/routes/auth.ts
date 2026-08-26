import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import db from '../db.js';
import { JWT_SECRET, authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { resetBruteForce } from '../middleware/security.js';
import { sendEmail, loginNotificationHtml, verificationEmailHtml } from '../lib/email.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ error: 'Email, username and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) return res.status(400).json({ error: 'Username must be 3-20 chars, lowercase letters, numbers, underscores' });

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const existingProfile = db.prepare('SELECT id FROM profiles WHERE username = ?').get(username);
    if (existingProfile) return res.status(400).json({ error: 'Username already taken' });

    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(email);

    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuid();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO pending_registrations (id, email, username, password_hash, code, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, email, username, passwordHash, code, expiresAt
    );

    sendEmail(
      email,
      'Verify your kio.lol account',
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#111">Your verification code</h2>
        <p style="color:#555;line-height:1.6">Enter this 6-digit code to complete your registration:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#8b5cf6;text-align:center;padding:24px 0;font-family:monospace">${code}</div>
        <p style="color:#999;font-size:12px">This code expires in 15 minutes. Ignore if you didn't sign up.</p>
      </div>`
    ).catch(() => {});

    res.json({ pendingId: id, email, message: 'Verification code sent to your email' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const { pendingId, code } = req.body;
    if (!pendingId || !code) return res.status(400).json({ error: 'Pending ID and code required' });

    const pending = db.prepare('SELECT * FROM pending_registrations WHERE id = ?').get(pendingId) as any;
    if (!pending) return res.status(400).json({ error: 'Registration session expired. Please try again.' });

    if (new Date(pending.expires_at) < new Date()) {
      db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pendingId);
      return res.status(400).json({ error: 'Code expired. Please register again.' });
    }

    if (pending.attempts >= 5) {
      db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pendingId);
      return res.status(400).json({ error: 'Too many failed attempts. Please register again.' });
    }

    if (pending.code !== code) {
      db.prepare('UPDATE pending_registrations SET attempts = attempts + 1 WHERE id = ?').run(pendingId);
      return res.status(400).json({ error: 'Invalid code', attemptsLeft: 5 - pending.attempts - 1 });
    }

    const id = uuid();
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, pending.email, pending.password_hash);

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
      uuid(), id, refreshTokenHash, refreshExpiresAt
    );

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const userAgent = String(req.headers['user-agent'] || '');

    try {
      db.prepare('INSERT INTO login_history (id, user_id, ip, user_agent, success) VALUES (?, ?, ?, ?, 1)').run(
        uuid(), id, ip, userAgent
      );
      db.prepare('INSERT INTO sessions (id, user_id, token_hash, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuid(), id, refreshTokenHash, ip, userAgent, refreshExpiresAt
      );
    } catch {}

    db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pendingId);

    sendEmail(pending.email, 'Welcome to kio.lol', verificationEmailHtml(uuidv4())).catch(() => {});

    res.json({ token, refreshToken, user: { id, email: pending.email }, username: pending.username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register/resend', async (req, res) => {
  try {
    const { pendingId } = req.body;
    if (!pendingId) return res.status(400).json({ error: 'Pending ID required' });

    const pending = db.prepare('SELECT * FROM pending_registrations WHERE id = ?').get(pendingId) as any;
    if (!pending) return res.status(400).json({ error: 'Registration session expired. Please try again.' });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.prepare('UPDATE pending_registrations SET code = ?, expires_at = ?, attempts = 0 WHERE id = ?').run(code, expiresAt, pendingId);

    sendEmail(
      pending.email,
      'Verify your kio.lol account',
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#111">Your new verification code</h2>
        <p style="color:#555;line-height:1.6">Enter this 6-digit code to complete your registration:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#8b5cf6;text-align:center;padding:24px 0;font-family:monospace">${code}</div>
        <p style="color:#999;font-size:12px">This code expires in 15 minutes. Ignore if you didn't sign up.</p>
      </div>`
    ).catch(() => {});

    res.json({ message: 'New code sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      try {
        db.prepare('INSERT INTO login_history (id, user_id, ip, user_agent, success) VALUES (?, ?, ?, ?, 0)').run(
          uuid(), 'unknown', ip, String(req.headers['user-agent'] || '')
        );
      } catch {}
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      try {
        db.prepare('INSERT INTO login_history (id, user_id, ip, user_agent, success) VALUES (?, ?, ?, ?, 0)').run(
          uuid(), user.id, ip, String(req.headers['user-agent'] || '')
        );
      } catch {}
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    resetBruteForce(email);

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const userAgent = String(req.headers['user-agent'] || '');
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
        uuid(), user.id, refreshTokenHash, refreshExpiresAt
      );
      db.prepare('INSERT INTO login_history (id, user_id, ip, user_agent, success) VALUES (?, ?, ?, ?, 1)').run(
        uuid(), user.id, ip, userAgent
      );
      db.prepare('INSERT INTO sessions (id, user_id, token_hash, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuid(), user.id, refreshTokenHash, ip, userAgent, refreshExpiresAt
      );
    } catch {}

    sendEmail(user.email, 'New login to your account', loginNotificationHtml(ip, userAgent)).catch(() => {});

    res.json({ token, refreshToken, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const tokenHash = hashToken(refreshToken);
    const stored = db.prepare(
      'SELECT rt.*, u.id as uid FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token_hash = ? AND rt.revoked = 0'
    ).get(tokenHash) as any;

    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });
    if (new Date(stored.expires_at) < new Date()) {
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

    const newAccessToken = jwt.sign({ userId: stored.user_id }, JWT_SECRET, { expiresIn: '30d' });
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(
      uuid(), stored.user_id, newRefreshHash, newExpiresAt
    );

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ? AND user_id = ?').run(tokenHash, req.userId);
    }
    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(req.userId);
    res.json({ ok: true });
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

    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(resetToken.user_id);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId) as any;
  const emailVerification = db.prepare(
    'SELECT verified FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(req.userId) as any;
  res.json({
    user: {
      ...user,
      email_verified: emailVerification?.verified === 1 || false,
    },
    profile: {
      ...profile,
      role: profile?.role || 'user',
    },
  });
});

export default router;
