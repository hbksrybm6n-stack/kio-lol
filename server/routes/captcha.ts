import { Router } from 'express';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'kio-lol-captcha-2026';

function signAnswer(answer: number, id: string): string {
  return crypto.createHmac('sha256', CAPTCHA_SECRET).update(`${id}:${answer}`).digest('hex');
}

const router = Router();

router.get('/generate', (_req, res) => {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const ops = ['+', '-', '*'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer: number;
  if (op === '+') answer = a + b;
  else if (op === '-') answer = a - b;
  else answer = a * b;

  const id = uuid();
  const token = uuid().replace(/-/g, '');
  const signature = signAnswer(answer, id);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO captcha_tokens (id, token, expires_at) VALUES (?, ?, ?)').run(id, token, expiresAt);

  res.json({ id, question: `${a} ${op} ${b} = ?`, token, signature });
});

router.post('/verify', (req, res) => {
  const { id, answer, token } = req.body;
  if (!id || answer === undefined || !token) {
    return res.status(400).json({ verified: false, error: 'Missing data' });
  }

  const record = db.prepare('SELECT * FROM captcha_tokens WHERE id = ? AND token = ? AND verified = 0').get(id, token) as any;
  if (!record) return res.status(400).json({ verified: false, error: 'Invalid captcha' });

  if (new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM captcha_tokens WHERE id = ?').run(id);
    return res.status(400).json({ verified: false, error: 'Expired' });
  }

  db.prepare('UPDATE captcha_tokens SET verified = 1 WHERE id = ?').run(id);
  res.json({ verified: true });
});

export default router;
