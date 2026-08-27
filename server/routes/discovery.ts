import { Router } from 'express';
import db from '../db.js';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/trending', async (_req, res) => {
  try {
    const profiles = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.banner_url, p.view_count, p.bio, p.created_at,
        (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count,
        (SELECT COUNT(*) FROM user_badges WHERE profile_id = p.id) as badge_count
      FROM profiles p
      WHERE p.is_active = 1
      ORDER BY p.view_count DESC
      LIMIT 20
    `).all();
    res.json(profiles);
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

router.get('/recent', async (_req, res) => {
  try {
    const profiles = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.banner_url, p.view_count, p.bio, p.created_at,
        (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count
      FROM profiles p
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all();
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/directory', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const sort = (req.query.sort as string) || 'views';

    let orderBy = 'p.view_count DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';
    else if (sort === 'oldest') orderBy = 'p.created_at ASC';
    else if (sort === 'name') orderBy = 'p.username ASC';

    let where = 'p.is_active = 1';
    const params: any[] = [];
    if (search) {
      where += ' AND (p.username LIKE ? OR p.display_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = await db.prepare(`SELECT COUNT(*) as count FROM profiles p WHERE ${where}`).get(...params) as any;

    const profiles = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.banner_url, p.view_count, p.bio, p.created_at,
        (SELECT COUNT(*) FROM links WHERE profile_id = p.id AND is_active = 1) as link_count
      FROM profiles p
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      profiles,
      pagination: {
        page,
        limit,
        total: total?.count || 0,
        pages: Math.ceil((total?.count || 0) / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query) return res.json([]);

    const profiles = await db.prepare(`
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.view_count, p.bio
      FROM profiles p
      WHERE p.is_active = 1 AND (p.username LIKE ? OR p.display_name LIKE ?)
      ORDER BY p.view_count DESC
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`);

    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
