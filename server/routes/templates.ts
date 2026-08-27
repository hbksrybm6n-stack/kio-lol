import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.json([]);
  const mine = await db.prepare('SELECT * FROM templates WHERE creator_id = ? ORDER BY created_at DESC').all(profile.id);
  const pub = await db.prepare('SELECT * FROM templates WHERE is_public = 1 AND creator_id != ? ORDER BY uses_count DESC LIMIT 20').all(profile.id);
  res.json([...mine, ...pub]);
});

router.get('/public', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json(await db.prepare('SELECT * FROM templates WHERE is_public = 1 ORDER BY uses_count DESC LIMIT ?').all(limit));
});

router.get('/mine', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.json([]);
  res.json(await db.prepare('SELECT * FROM templates WHERE creator_id = ? ORDER BY created_at DESC').all(profile.id));
});

router.get('/:id', async (req, res) => {
  const template = await db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Not found' });
  res.json(template);
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const { name, description, config, is_public } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuid();
  await db.prepare('INSERT INTO templates (id, creator_id, name, description, config, is_public, share_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, profile.id, name, description || '', JSON.stringify(config || {}), is_public ? 1 : 0, uuid().slice(0, 8)
  );
  res.json(await db.prepare('SELECT * FROM templates WHERE id = ?').get(id));
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const template = await db.prepare('SELECT * FROM templates WHERE id = ? AND creator_id = ?').get(req.params.id, profile.id);
  if (!template) return res.status(404).json({ error: 'Not found' });
  const { name, description, is_public } = req.body;
  if (name !== undefined) await db.prepare('UPDATE templates SET name = ? WHERE id = ?').run(name, req.params.id);
  if (description !== undefined) await db.prepare('UPDATE templates SET description = ? WHERE id = ?').run(description, req.params.id);
  if (is_public !== undefined) await db.prepare('UPDATE templates SET is_public = ? WHERE id = ?').run(is_public ? 1 : 0, req.params.id);
  res.json(await db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
  await db.prepare('DELETE FROM templates WHERE id = ? AND creator_id = ?').run(req.params.id, profile?.id);
  res.json({ ok: true });
});

router.post('/:id/apply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const template = await db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as any;
    if (!template) return res.status(404).json({ error: 'Template not found' });

    await db.prepare('UPDATE templates SET uses_count = uses_count + 1 WHERE id = ?').run(req.params.id);

    const config = JSON.parse(template.config || '{}');
    const allowedFields = [
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
    ];
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of allowedFields) {
      if (config[f] !== undefined) {
        let val = config[f];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        updates.push(`${f} = ?`);
        values.push(val);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(profile.id);
      await db.prepare(`UPDATE profile_config SET ${updates.join(', ')} WHERE profile_id = ?`).run(...values);
    }

    const saved = await db.prepare('SELECT * FROM profile_config WHERE profile_id = ?').get(profile.id);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/use', async (req, res) => {
  await db.prepare('UPDATE templates SET uses_count = uses_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
