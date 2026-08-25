import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id, view_count FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const clicks = db.prepare('SELECT COALESCE(SUM(click_count), 0) as total FROM links WHERE profile_id = ?').get(profile.id) as any;
    const uniqueVisitors = db.prepare(
      'SELECT COUNT(DISTINCT visitor_ip) as total FROM analytics WHERE profile_id = ? AND event_type = ?'
    ).get(profile.id, 'view') as any;
    const activeLinks = db.prepare('SELECT COUNT(*) as total FROM links WHERE profile_id = ? AND is_active = 1').get(profile.id) as any;

    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dailyViews = db.prepare(
      'SELECT date, views FROM daily_stats WHERE profile_id = ? AND date >= ? ORDER BY date ASC'
    ).all(profile.id, startDate.toISOString().split('T')[0]) as any[];

    const topLinks = db.prepare(
      'SELECT title as name, url, click_count as clicks FROM links WHERE profile_id = ? ORDER BY click_count DESC LIMIT 10'
    ).all(profile.id);

    res.json({
      totalViews: profile.view_count || 0,
      uniqueVisitors: uniqueVisitors?.total || 0,
      totalClicks: clicks?.total || 0,
      activeLinks: activeLinks?.total || 0,
      dailyViews,
      topLinks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/daily/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const stats = db.prepare(
    'SELECT * FROM daily_stats WHERE profile_id = ? AND date >= ? ORDER BY date ASC'
  ).all(req.params.profileId, startDate.toISOString().split('T')[0]);
  res.json(stats);
});

router.get('/top-links/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const links = db.prepare(
    'SELECT id, title, url, icon, color, click_count FROM links WHERE profile_id = ? ORDER BY click_count DESC LIMIT ?'
  ).all(req.params.profileId, limit);
  res.json(links);
});

router.get('/totals/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const profile = db.prepare('SELECT view_count FROM profiles WHERE id = ?').get(req.params.profileId) as any;
  const clicks = db.prepare('SELECT COALESCE(SUM(click_count), 0) as total FROM links WHERE profile_id = ?').get(req.params.profileId) as any;
  const uniqueVisitors = db.prepare(
    'SELECT COUNT(DISTINCT visitor_ip) as total FROM analytics WHERE profile_id = ? AND event_type = ?'
  ).all(req.params.profileId, 'view') as any;
  res.json({
    views: profile?.view_count || 0,
    clicks: clicks?.total || 0,
    uniqueVisitors: uniqueVisitors?.[0]?.total || 0
  });
});

router.get('/referrers/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const referrers = db.prepare(
    `SELECT referer, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND referer != '' GROUP BY referer ORDER BY count DESC LIMIT 10`
  ).all(req.params.profileId, 'view');
  res.json(referrers);
});

router.get('/devices/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const devices = db.prepare(
    `SELECT visitor_agent, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? GROUP BY visitor_agent ORDER BY count DESC LIMIT 10`
  ).all(req.params.profileId, 'view');
  res.json(devices);
});

export default router;
