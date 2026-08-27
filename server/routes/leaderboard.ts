import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const leaders = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.view_count,
             (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count,
             (SELECT COUNT(*) FROM user_badges WHERE profile_id = p.id) as badge_count
      FROM profiles p
      WHERE p.is_active = 1
      ORDER BY p.view_count DESC
      LIMIT 10
    `).all();

    res.json({ data: leaders });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.json({ data: [] });
  }
});

export default router;
