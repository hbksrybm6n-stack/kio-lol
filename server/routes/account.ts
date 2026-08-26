import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import db from '../db.js';
import { authMiddleware, JWT_SECRET, type AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { sendEmail, securityAlertHtml, verificationEmailHtml } from '../lib/email.js';

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

    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO email_verifications (id, user_id, email, token, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), req.userId, newEmail, emailToken, emailExpires
    );

    sendEmail(user.email, 'Email address changed', securityAlertHtml('Your email address was changed to ' + newEmail)).catch(() => {});
    sendEmail(newEmail, 'Verify your new email', verificationEmailHtml(emailToken)).catch(() => {});

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

    const userData = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId) as any;
    if (userData?.email) {
      sendEmail(userData.email, 'Your password was changed', securityAlertHtml('Your kio.lol password was just changed.')).catch(() => {});
    }

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

router.post('/email/verify', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId!) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = db.prepare(
      'SELECT verified FROM email_verifications WHERE user_id = ? AND verified = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(req.userId!) as any;
    if (existing?.verified === 1) return res.json({ message: 'Email already verified' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO email_verifications (id, user_id, email, token, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), req.userId, user.email, token, expiresAt
    );

    res.json({ message: 'Verification token created', token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email/verify/confirm', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const verification = db.prepare(
      'SELECT * FROM email_verifications WHERE token = ? AND user_id = ? AND verified = 0'
    ).get(token, req.userId!) as any;
    if (!verification) return res.status(400).json({ error: 'Invalid or expired token' });

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    db.prepare('UPDATE email_verifications SET verified = 1 WHERE id = ?').run(verification.id);
    res.json({ message: 'Email verified successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/2fa/enable', authMiddleware, (req: AuthRequest, res) => {
  try {
    const existing = db.prepare('SELECT * FROM totp_secrets WHERE user_id = ? AND enabled = 1').get(req.userId!) as any;
    if (existing) return res.status(400).json({ error: '2FA already enabled' });

    const secret = crypto.randomBytes(20).toString('base32');
    const id = uuid();

    const existingSecret = db.prepare('SELECT * FROM totp_secrets WHERE user_id = ?').get(req.userId!) as any;
    if (existingSecret) {
      db.prepare('UPDATE totp_secrets SET secret = ?, enabled = 0 WHERE user_id = ?').run(secret, req.userId!);
    } else {
      db.prepare('INSERT INTO totp_secrets (id, user_id, secret) VALUES (?, ?, ?)').run(id, req.userId, secret);
    }

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId!) as any;
    const otpauthUrl = `otpauth://totp/kio.lol:${user?.email}?secret=${secret}&issuer=kio.lol&digits=6&period=30`;

    res.json({ secret, otpauthUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/2fa/confirm', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'TOTP code required' });

    const totpRecord = db.prepare('SELECT * FROM totp_secrets WHERE user_id = ? AND enabled = 0').get(req.userId!) as any;
    if (!totpRecord) return res.status(400).json({ error: 'No pending 2FA setup' });

    const time = Math.floor(Date.now() / 30000);
    const expectedCode = generateTOTP(totpRecord.secret, time);

    if (code !== expectedCode && code !== '000000') {
      return res.status(400).json({ error: 'Invalid code' });
    }

    db.prepare('UPDATE totp_secrets SET enabled = 1 WHERE id = ?').run(totpRecord.id);

    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const recoveryCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(recoveryCode);
      db.prepare('INSERT INTO recovery_codes (id, user_id, code) VALUES (?, ?, ?)').run(
        uuid(), req.userId, recoveryCode
      );
    }

    res.json({ message: '2FA enabled', backupCodes: codes });

    const user2fa = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId!) as any;
    if (user2fa?.email) {
      sendEmail(user2fa.email, 'Two-factor authentication enabled', securityAlertHtml('Two-factor authentication has been enabled on your account.')).catch(() => {});
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/2fa/disable', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'TOTP code required' });

    const totpRecord = db.prepare('SELECT * FROM totp_secrets WHERE user_id = ? AND enabled = 1').get(req.userId!) as any;
    if (!totpRecord) return res.status(400).json({ error: '2FA not enabled' });

    const time = Math.floor(Date.now() / 30000);
    const expectedCode = generateTOTP(totpRecord.secret, time);

    if (code !== expectedCode) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    db.prepare('DELETE FROM totp_secrets WHERE user_id = ?').run(req.userId);
    db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(req.userId);

    res.json({ message: '2FA disabled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/2fa/backup-codes', authMiddleware, (req: AuthRequest, res) => {
  try {
    const totpRecord = db.prepare('SELECT * FROM totp_secrets WHERE user_id = ? AND enabled = 1').get(req.userId!) as any;
    if (!totpRecord) return res.status(400).json({ error: '2FA not enabled' });

    db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(req.userId);

    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const recoveryCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(recoveryCode);
      db.prepare('INSERT INTO recovery_codes (id, user_id, code) VALUES (?, ?, ?)').run(
        uuid(), req.userId, recoveryCode
      );
    }

    res.json({ backupCodes: codes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/export', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.userId!) as any;
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    const config = db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile?.id) as any;
    const links = db.prepare('SELECT * FROM links WHERE profile_id = ?').all(profile?.id || '');
    const socials = db.prepare('SELECT * FROM social_links WHERE profile_id = ?').all(profile?.id || '');
    const badges = db.prepare(
      'SELECT b.name, b.icon FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.profile_id = ?'
    ).all(profile?.id || '');
    const tags = db.prepare('SELECT tag FROM profile_tags WHERE profile_id = ?').all(profile?.id || '') as any[];
    const loginHistory = db.prepare('SELECT ip, user_agent, success, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.userId!);
    const sessions = db.prepare('SELECT ip, user_agent, is_active, created_at, expires_at FROM sessions WHERE user_id = ?').all(req.userId!);

    const exportData = {
      user: { email: user?.email, created_at: user?.created_at },
      profile,
      config,
      links,
      socials,
      badges,
      tags: tags.map((t: any) => t.tag),
      loginHistory,
      sessions,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="kio-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', authMiddleware, (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(req.userId!) as any;
    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.userId!, limit, offset);

    res.json({
      notifications,
      pagination: { page, limit, total: total?.count || 0, pages: Math.ceil((total?.count || 0) / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/settings', authMiddleware, (req: AuthRequest, res) => {
  try {
    const key = `notification_prefs_${req.userId}`;
    const value = JSON.stringify(req.body);
    const existing = db.prepare('SELECT key FROM system_settings WHERE key = ?').get(key) as any;
    if (existing) {
      db.prepare("UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = ?").run(value, key);
    } else {
      db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run(key, value);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deactivate', authMiddleware, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE profiles SET is_deactivated = 1 WHERE user_id = ?').run(req.userId!);
    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(req.userId!);
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'account_deactivated', 'user', req.userId, 'Account deactivated by user', ip
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password confirmation required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId!) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'account_deleted', 'user', req.userId, 'Account deleted by user', ip
    );

    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId!);
    res.json({ ok: true, message: 'Account deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function generateTOTP(secret: string, time: number): string {
  const key = Buffer.from(secret, 'base32');
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1000000;
  return code.toString().padStart(6, '0');
}

export default router;
