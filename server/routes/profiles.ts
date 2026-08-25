import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

router.get('/username/:username', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE username = ? AND is_active = 1').get(req.params.username) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

router.get('/config', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const config = db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile.id) as any;
    if (config && typeof config.widgets === 'string') {
      try { config.widgets = JSON.parse(config.widgets); } catch { config.widgets = []; }
    }
    res.json(config || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/config', (req, res) => {
  const config = db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(req.params.id) as any;
  if (config && typeof config.widgets === 'string') {
    try { config.widgets = JSON.parse(config.widgets); } catch { config.widgets = []; }
  }
  res.json(config || {});
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { username, display_name } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(username);
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const existingProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!);
    if (existingProfile) return res.status(400).json({ error: 'Profile already exists' });

    const id = uuid();
    const isFirstUser = !(db.prepare('SELECT id FROM profiles LIMIT 1').get());
    db.prepare('INSERT INTO profiles (id, user_id, username, display_name, is_admin) VALUES (?, ?, ?, ?, ?)').run(id, req.userId!, username, display_name || username, isFirstUser ? 1 : 0);
    db.prepare('INSERT INTO profile_config (id, profile_id) VALUES (?, ?)').run(uuid(), id);

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const fields = ['display_name', 'bio', 'avatar_url', 'banner_url', 'username', 'is_active', 'location'];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(profile.id);
      db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/config', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const booleanFields = new Set([
      'enable_particles', 'enable_snow', 'enable_stars', 'enable_glow', 'enable_custom_cursor',
      'enable_typewriter', 'enable_3d_tilt', 'enable_matrix_rain', 'enable_floating_shapes',
      'enable_neon_border', 'enable_animated_gradient', 'enable_gradient', 'enable_username_effects',
      'enable_animated_title', 'enable_cursor_effects', 'enable_click_effects',
      'enable_background_effects', 'enable_text_effects', 'music_autoplay', 'music_loop', 'music_show_player',
      'show_discord_status', 'show_discord_rpc', 'show_avatar', 'show_badges',
      'show_views', 'show_social_links', 'profile_border',
    ]);
    const integerFields = new Set([
      'particle_count', 'background_blur', 'overlay_opacity', 'card_opacity',
      'card_blur', 'card_border_radius', 'music_volume', 'music_start_time', 'avatar_size',
      'background_opacity', 'background_scale', 'profile_opacity', 'profile_border_radius', 'profile_blur',
    ]);
    const configFields = [
      'theme', 'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color', 'icon_color',
      'background_type', 'background_url', 'background_video_url', 'background_blur', 'background_opacity',
      'background_scale', 'background_position', 'background_effect',
      'font_family', 'heading_font', 'mono_font',
      'profile_layout', 'profile_opacity', 'profile_blur', 'profile_border', 'profile_border_radius',
      'enable_gradient', 'gradient_colors', 'enable_username_effects', 'enable_animated_title', 'animated_title_text',
      'enable_typewriter', 'typewriter_text',
      'enable_particles', 'particle_color', 'particle_count', 'enable_snow', 'enable_stars',
      'enable_glow', 'glow_color', 'enable_custom_cursor', 'cursor_url',
      'enable_matrix_rain', 'enable_floating_shapes',
      'enable_neon_border', 'enable_animated_gradient',
      'enable_cursor_effects', 'enable_click_effects', 'enable_background_effects', 'enable_text_effects',
      'overlay_effect', 'overlay_opacity', 'card_style', 'card_opacity', 'card_blur', 'card_border_radius',
      'music_url', 'music_title', 'music_artist', 'music_cover', 'music_autoplay', 'music_volume',
      'music_loop', 'music_show_player', 'music_start_time',
      'discord_user_id', 'show_discord_status', 'show_discord_rpc',
      'layout_style', 'show_avatar', 'avatar_shape', 'avatar_size',
      'show_badges', 'show_views', 'show_social_links',
      'widgets',
    ];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of configFields) {
      if (req.body[f] !== undefined) {
        let val = req.body[f];
        if (booleanFields.has(f)) val = val ? 1 : 0;
        else if (integerFields.has(f)) val = parseInt(String(val)) || 0;
        else if (f === 'discord_user_id') val = String(val || '');
        else if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        else if (val === null || val === undefined) val = '';
        updates.push(`${f} = ?`);
        values.push(val);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(profile.id);
      db.prepare(`UPDATE profile_config SET ${updates.join(', ')} WHERE profile_id = ?`).run(...values);
    }

    const config = db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile.id);
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/view', (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    const profileId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    const existing = db.prepare(
      "SELECT id FROM analytics WHERE profile_id = ? AND event_type = 'view' AND visitor_ip = ? AND date(created_at) = ?"
    ).get(profileId, ip, today);

    if (existing) {
      return res.json({ ok: true, counted: false });
    }

    db.prepare('UPDATE profiles SET view_count = view_count + 1 WHERE id = ?').run(profileId);
    db.prepare(`INSERT INTO daily_stats (id, profile_id, date, views, unique_visitors) VALUES (?, ?, ?, 1, 1)
      ON CONFLICT(profile_id, date) DO UPDATE SET views = views + 1, unique_visitors = unique_visitors + 1`).run(uuid(), profileId, today);

    try {
      db.prepare('INSERT INTO analytics (id, profile_id, event_type, visitor_ip, visitor_agent, referer) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuid(), profileId, 'view', ip, req.headers['user-agent'] || '', req.headers['referer'] || ''
      );
    } catch {}

    res.json({ ok: true, counted: true });
  } catch {
    res.json({ ok: true });
  }
});

router.get('/check/:username', (req, res) => {
  const excludeUserId = req.query.exclude as string;
  let existing;
  if (excludeUserId) {
    existing = db.prepare('SELECT id FROM profiles WHERE username = ? AND user_id != ?').get(req.params.username, excludeUserId);
  } else {
    existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(req.params.username);
  }
  res.json({ available: !existing });
});

router.get('/search/:query', (req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles WHERE username LIKE ? AND is_active = 1 LIMIT 20').all(`%${req.params.query}%`);
  res.json(profiles);
});

router.get('/admin/all', authMiddleware, (req: AuthRequest, res) => {
  const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY created_at DESC LIMIT 100').all();
  res.json(profiles);
});

router.put('/admin/:userId/ban', authMiddleware, (req: AuthRequest, res) => {
  const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { active } = req.body;
  db.prepare('UPDATE profiles SET is_active = ? WHERE user_id = ?').run(active ? 1 : 0, req.params.userId);
  res.json({ ok: true });
});

router.put('/admin/:userId/admin', authMiddleware, (req: AuthRequest, res) => {
  const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { isAdmin } = req.body;
  db.prepare('UPDATE profiles SET is_admin = ? WHERE user_id = ?').run(isAdmin ? 1 : 0, req.params.userId);
  res.json({ ok: true });
});

export default router;
