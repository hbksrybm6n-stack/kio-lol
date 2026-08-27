import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

async function apiKeyAuth(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const prefix = apiKey.substring(0, 8);
  const keyRecord = await db.prepare(
    'SELECT ak.*, u.id as uid FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.key_prefix = ? AND ak.is_active = 1'
  ).get(prefix) as any;

  if (!keyRecord) return res.status(401).json({ error: 'Invalid API key' });

  const valid = bcrypt.compareSync(apiKey, keyRecord.key_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid API key' });

  await db.prepare('UPDATE api_keys SET last_used_at = datetime(\'now\') WHERE id = ?').run(keyRecord.id);

  req.apiUserId = keyRecord.user_id;
  req.apiPermissions = keyRecord.permissions;
  next();
}

router.get('/profile/:username', apiKeyAuth, async (req: any, res) => {
  try {
    let profile = await db.prepare('SELECT * FROM profiles WHERE username = ? AND is_active = 1').get(req.params.username) as any;
    if (!profile) {
      profile = await db.prepare('SELECT * FROM profiles WHERE slug = ? AND slug != \'\' AND is_active = 1').get(req.params.username) as any;
    }
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (profile.is_deactivated) return res.status(404).json({ error: 'Profile deactivated' });

    const config = await db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile.id) as any;
    if (config && typeof config.widgets === 'string') {
      try { config.widgets = JSON.parse(config.widgets); } catch { config.widgets = []; }
    }

    const socials = await db.prepare('SELECT * FROM social_links WHERE profile_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(profile.id);
    const tags = await db.prepare('SELECT tag FROM profile_tags WHERE profile_id = ?').all(profile.id) as any[];
    const badges = await db.prepare(
      'SELECT b.name, b.icon, b.color FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.profile_id = ?'
    ).all(profile.id);

    res.json({
      profile: {
        ...profile,
        tags: tags.map((t: any) => t.tag),
      },
      config,
      socials,
      badges,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/:username/links', apiKeyAuth, async (req: any, res) => {
  try {
    let profile = await db.prepare('SELECT id FROM profiles WHERE username = ? AND is_active = 1').get(req.params.username) as any;
    if (!profile) {
      profile = await db.prepare('SELECT id FROM profiles WHERE slug = ? AND slug != \'\' AND is_active = 1').get(req.params.username) as any;
    }
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const links = await db.prepare("SELECT id, title, url, description, icon, color, background_color, hover_color, click_count, sort_order FROM links WHERE profile_id = ? AND is_active = 1 AND visibility = 'public' ORDER BY sort_order ASC").all(profile.id);
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/:username/socials', apiKeyAuth, async (req: any, res) => {
  try {
    let profile = await db.prepare('SELECT id FROM profiles WHERE username = ? AND is_active = 1').get(req.params.username) as any;
    if (!profile) {
      profile = await db.prepare('SELECT id FROM profiles WHERE slug = ? AND slug != \'\' AND is_active = 1').get(req.params.username) as any;
    }
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const socials = await db.prepare('SELECT * FROM social_links WHERE profile_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(profile.id);
    res.json(socials);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
