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
    `SELECT referer, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND referer != '' GROUP BY referer ORDER BY count DESC LIMIT 20`
  ).all(req.params.profileId, 'view');
  res.json(referrers);
});

router.get('/devices/:profileId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const devices = db.prepare(
      `SELECT device_type, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND device_type != '' GROUP BY device_type ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    const browsers = db.prepare(
      `SELECT browser, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND browser != '' GROUP BY browser ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    const operatingSystems = db.prepare(
      `SELECT os, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND os != '' GROUP BY os ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    res.json({ devices, browsers, operatingSystems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countries/:profileId', authMiddleware, (req: AuthRequest, res) => {
  const countries = db.prepare(
    `SELECT country, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND country != '' GROUP BY country ORDER BY count DESC LIMIT 20`
  ).all(req.params.profileId, 'view');
  res.json(countries);
});

router.get('/export/:profileId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const profile = db.prepare('SELECT id, user_id FROM profiles WHERE id = ?').get(req.params.profileId) as any;
    if (!profile || profile.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = db.prepare(
      `SELECT event_type, link_id, visitor_ip, referer, device_type, browser, os, country, created_at
       FROM analytics WHERE profile_id = ? AND created_at >= ? ORDER BY created_at DESC`
    ).all(req.params.profileId, startDate.toISOString());

    let csv = 'Event Type,Link ID,Visitor IP,Referrer,Device Type,Browser,OS,Country,Created At\n';
    for (const row of analytics as any[]) {
      csv += `"${row.event_type}","${row.link_id || ''}","${row.visitor_ip || ''}","${row.referer || ''}","${row.device_type || ''}","${row.browser || ''}","${row.os || ''}","${row.country || ''}","${row.created_at || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${req.params.profileId}-${days}d.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
