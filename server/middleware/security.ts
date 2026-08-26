import type { Request, Response, NextFunction } from 'express';

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const viewTracker = new Map<string, { count: number; windowStart: number }>();

export function bruteForceProtection(req: Request, res: Response, next: NextFunction) {
  if (req.path !== '/api/auth/login') return next();
  const email = (req.body?.email || '').toLowerCase().trim();
  if (!email) return next();
  
  const key = `login:${email}`;
  const now = Date.now();
  const record = loginAttempts.get(key);
  
  if (record) {
    if (now - record.firstAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(key);
    } else if (record.count >= 5) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }
  }
  
  const current = loginAttempts.get(key) || { count: 0, firstAttempt: now };
  current.count++;
  loginAttempts.set(key, current);
  next();
}

export function resetBruteForce(email: string) {
  loginAttempts.delete(`login:${email.toLowerCase().trim()}`);
}

export function antiSpam(req: Request, res: Response, next: NextFunction) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }
  
  record.count++;
  if (record.count > 120) {
    return res.status(429).json({ error: 'Too many requests. Slow down.' });
  }
  next();
}

export function viewBotCheck(ip: string, profileId: string): boolean {
  const key = `${ip}:${profileId}`;
  const now = Date.now();
  const record = viewTracker.get(key);
  
  if (!record || now - record.windowStart > 60000) {
    viewTracker.set(key, { count: 1, windowStart: now });
    return false;
  }
  
  record.count++;
  if (record.count > 10) return true;
  return false;
}

export function contentModerator(text: string): { clean: boolean; reason?: string } {
  if (!text) return { clean: true };
  if (text.length > 5000) return { clean: false, reason: 'Text too long' };
  if (text === text.toUpperCase() && text.length > 50) return { clean: false, reason: 'Excessive caps' };
  const spamPatterns = [/bit\.ly/i, /tinyurl\.com/i, /t\.co\//i];
  for (const p of spamPatterns) {
    if (p.test(text)) return { clean: false, reason: 'Suspicious URL detected' };
  }
  return { clean: true };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of viewTracker) {
    if (now - val.windowStart > 120000) viewTracker.delete(key);
  }
  for (const [key, val] of loginAttempts) {
    if (now - val.firstAttempt > 15 * 60 * 1000) loginAttempts.delete(key);
  }
  for (const [key, val] of requestCounts) {
    if (now > val.resetAt) requestCounts.delete(key);
  }
}, 300000);
