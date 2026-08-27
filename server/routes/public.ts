import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { contentModerator } from '../middleware/security.js';

const router = Router();

router.get('/profile/:username', async (req, res) => {
  try {
    const profile = await db.prepare('SELECT * FROM profiles WHERE username = ? AND is_active = 1').get(req.params.username) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const config = await db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile.id) as any;
    if (config && typeof config.widgets === 'string') {
      try { config.widgets = JSON.parse(config.widgets); } catch { config.widgets = []; }
    }

    const links = await db.prepare("SELECT * FROM links WHERE profile_id = ? AND is_active = 1 AND visibility = 'public' ORDER BY sort_order ASC").all(profile.id);
    const socials = await db.prepare('SELECT * FROM social_links WHERE profile_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(profile.id);
    const badges = await db.prepare(
      'SELECT b.name, b.icon, b.color, b.description FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.profile_id = ?'
    ).all(profile.id);

    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
        location: profile.location,
        view_count: profile.view_count,
        created_at: profile.created_at,
        custom_title: profile.custom_title,
        premium: profile.premium,
      },
      config,
      links,
      socials,
      badges,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const leaders = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.view_count, p.bio, p.created_at,
        (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count,
        (SELECT COUNT(*) FROM user_badges WHERE profile_id = p.id) as badge_count
      FROM profiles p
      WHERE p.is_active = 1
      ORDER BY p.view_count DESC
      LIMIT 50
    `).all();
    res.json(leaders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured', async (_req, res) => {
  try {
    const profiles = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.banner_url, p.view_count, p.bio, p.created_at,
        (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count
      FROM profiles p
      WHERE p.is_active = 1 AND p.featured = 1
      ORDER BY p.view_count DESC
      LIMIT 20
    `).all();
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/report', async (req, res) => {
  try {
    const { reported_profile_id, reason, description, category } = req.body;
    if (!reported_profile_id || !reason) return res.status(400).json({ error: 'Required fields missing' });

    if (description) {
      const check = contentModerator(description);
      if (!check.clean) return res.status(400).json({ error: check.reason });
    }

    const id = uuid();
    await db.prepare('INSERT INTO profile_reports (id, reported_profile_id, reason, description, category) VALUES (?, ?, ?, ?, ?)').run(
      id, reported_profile_id, reason, description || '', category || 'other'
    );

    res.json({ ok: true, reportId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
