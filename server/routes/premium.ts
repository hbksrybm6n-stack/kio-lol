import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

async function requireAdmin(req: AuthRequest, res: any): Promise<boolean> {
  const admin = await db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

router.get('/plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const plans = await db.prepare('SELECT * FROM premium_plans ORDER BY price_monthly ASC').all();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { name, price_monthly, price_yearly, features } = req.body;
    if (!name) return res.status(400).json({ error: 'Plan name required' });
    const id = uuid();
    await db.prepare('INSERT INTO premium_plans (id, name, price_monthly, price_yearly, features) VALUES (?, ?, ?, ?, ?)').run(
      id, name, price_monthly || 0, price_yearly || 0, JSON.stringify(features || [])
    );
    const plan = await db.prepare('SELECT * FROM premium_plans WHERE id = ?').get(id);
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plans/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { name, price_monthly, price_yearly, features } = req.body;
    const existing = await db.prepare('SELECT * FROM premium_plans WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    await db.prepare('UPDATE premium_plans SET name = ?, price_monthly = ?, price_yearly = ?, features = ? WHERE id = ?').run(
      name ?? existing.name,
      price_monthly ?? existing.price_monthly,
      price_yearly ?? existing.price_yearly,
      features ? JSON.stringify(features) : existing.features,
      req.params.id
    );
    const plan = await db.prepare('SELECT * FROM premium_plans WHERE id = ?').get(req.params.id);
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/plans/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    await db.prepare('DELETE FROM premium_plans WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assign', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { userId, planId, expiresAt } = req.body;
    if (!userId || !planId) return res.status(400).json({ error: 'userId and planId required' });

    await db.prepare('UPDATE profiles SET premium = 1, premium_until = ?, premium_plan = ? WHERE user_id = ?').run(
      expiresAt || '', planId, userId
    );

    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(userId) as any;
    if (profile) {
      try {
        await db.prepare('INSERT OR IGNORE INTO user_badges (id, profile_id, badge_id) VALUES (?, ?, ?)').run(uuid(), profile.id, 'b6');
      } catch {}
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'premium_assigned', 'user', userId, `Premium plan ${planId} assigned`, ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/remove/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    await db.prepare('UPDATE profiles SET premium = 0, premium_until = ?, premium_plan = ? WHERE user_id = ?').run('', '', req.params.userId);

    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    if (profile) {
      await db.prepare('DELETE FROM user_badges WHERE profile_id = ? AND badge_id = ?').run(profile.id, 'b6');
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      uuid(), req.userId, 'premium_removed', 'user', req.params.userId, 'Premium removed', ip
    );

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const profile = await db.prepare('SELECT premium, premium_until, premium_plan FROM profiles WHERE user_id = ?').get(req.params.userId) as any;
    res.json(profile || { premium: 0, premium_until: '', premium_plan: '' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscriptions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const subs = await db.prepare('SELECT p.user_id, p.username, p.premium, p.premium_until, p.premium_plan FROM profiles p WHERE p.premium = 1').all();
    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
