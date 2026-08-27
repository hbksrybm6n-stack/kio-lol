import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id, view_count FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const clicks = await db.prepare('SELECT COALESCE(SUM(click_count), 0) as total FROM links WHERE profile_id = ?').get(profile.id) as any;
    const uniqueVisitors = await db.prepare(
      'SELECT COUNT(DISTINCT visitor_ip) as total FROM analytics WHERE profile_id = ? AND event_type = ?'
    ).get(profile.id, 'view') as any;
    const activeLinks = await db.prepare('SELECT COUNT(*) as total FROM links WHERE profile_id = ? AND is_active = 1').get(profile.id) as any;

    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dailyViews = await db.prepare(
      'SELECT date, views FROM daily_stats WHERE profile_id = ? AND date >= ? ORDER BY date ASC'
    ).all(profile.id, startDate.toISOString().split('T')[0]) as any[];

    const topLinks = await db.prepare(
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

router.get('/daily/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const stats = await db.prepare(
    'SELECT * FROM daily_stats WHERE profile_id = ? AND date >= ? ORDER BY date ASC'
  ).all(req.params.profileId, startDate.toISOString().split('T')[0]);
  res.json(stats);
});

router.get('/top-links/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const links = await db.prepare(
    'SELECT id, title, url, icon, color, click_count FROM links WHERE profile_id = ? ORDER BY click_count DESC LIMIT ?'
  ).all(req.params.profileId, limit);
  res.json(links);
});

router.get('/totals/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  const profile = await db.prepare('SELECT view_count FROM profiles WHERE id = ?').get(req.params.profileId) as any;
  const clicks = await db.prepare('SELECT COALESCE(SUM(click_count), 0) as total FROM links WHERE profile_id = ?').get(req.params.profileId) as any;
  const uniqueVisitors = await db.prepare(
    'SELECT COUNT(DISTINCT visitor_ip) as total FROM analytics WHERE profile_id = ? AND event_type = ?'
  ).all(req.params.profileId, 'view') as any;
  res.json({
    views: profile?.view_count || 0,
    clicks: clicks?.total || 0,
    uniqueVisitors: uniqueVisitors?.[0]?.total || 0
  });
});

router.get('/referrers/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  const referrers = await db.prepare(
    `SELECT referer, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND referer != '' GROUP BY referer ORDER BY count DESC LIMIT 20`
  ).all(req.params.profileId, 'view');
  res.json(referrers);
});

router.get('/devices/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const devices = await db.prepare(
      `SELECT device_type, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND device_type != '' GROUP BY device_type ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    const browsers = await db.prepare(
      `SELECT browser, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND browser != '' GROUP BY browser ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    const operatingSystems = await db.prepare(
      `SELECT os, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND os != '' GROUP BY os ORDER BY count DESC`
    ).all(req.params.profileId, 'view');

    const countries = await db.prepare(
      `SELECT country, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND country != '' GROUP BY country ORDER BY count DESC LIMIT 20`
    ).all(req.params.profileId, 'view');

    res.json({ devices, browsers, operatingSystems, countries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countries/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  const countries = await db.prepare(
    `SELECT country, COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ? AND country != '' GROUP BY country ORDER BY count DESC LIMIT 20`
  ).all(req.params.profileId, 'view');
  res.json(countries);
});

router.get('/live/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = await db.prepare(
      `SELECT COUNT(DISTINCT visitor_ip) as count FROM analytics WHERE profile_id = ? AND created_at >= ? AND event_type = 'view'`
    ).get(req.params.profileId, fiveMinAgo) as any;
    res.json({ liveVisitors: result?.count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversion/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT view_count FROM profiles WHERE id = ?').get(req.params.profileId) as any;
    const totalClicks = await db.prepare(
      'SELECT COALESCE(SUM(click_count), 0) as total FROM links WHERE profile_id = ?'
    ).get(req.params.profileId) as any;
    const views = profile?.view_count || 0;
    const clicks = totalClicks?.total || 0;
    const rate = views > 0 ? ((clicks / views) * 100).toFixed(2) : '0';
    res.json({ views, clicks, conversionRate: parseFloat(rate) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/link/:linkId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const link = await db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.linkId) as any;
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const profile = await db.prepare('SELECT id FROM profiles WHERE id = ? AND user_id = ?').get(link.profile_id, req.userId!) as any;
    if (!profile) return res.status(403).json({ error: 'Forbidden' });

    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clicksByDay = await db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as clicks FROM analytics WHERE link_id = ? AND event_type = 'click' AND created_at >= ? GROUP BY date(created_at) ORDER BY date ASC`
    ).all(req.params.linkId, startDate.toISOString());

    const devices = await db.prepare(
      `SELECT device_type, COUNT(*) as count FROM analytics WHERE link_id = ? AND event_type = 'click' AND device_type != '' GROUP BY device_type ORDER BY count DESC`
    ).all(req.params.linkId);

    const referrers = await db.prepare(
      `SELECT referer, COUNT(*) as count FROM analytics WHERE link_id = ? AND event_type = 'click' AND referer != '' GROUP BY referer ORDER BY count DESC LIMIT 10`
    ).all(req.params.linkId);

    const totalClicks = await db.prepare(
      'SELECT click_count FROM links WHERE id = ?'
    ).get(req.params.linkId) as any;

    res.json({
      totalClicks: totalClicks?.click_count || 0,
      clicksByDay,
      devices,
      referrers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/:profileId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await db.prepare('SELECT id, user_id FROM profiles WHERE id = ?').get(req.params.profileId) as any;
    if (!profile || profile.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await db.prepare(
      `SELECT event_type, link_id, visitor_ip, referer, device_type, browser, os, country, created_at
       FROM analytics WHERE profile_id = ? AND created_at >= ? ORDER BY created_at DESC`
    ).all(req.params.profileId, startDate.toISOString());

    let csv = 'Event Type,Link ID,Visitor IP,Referrer,Device Type,Browser,OS,Country,Created At\n';
    for (const row of rows as any[]) {
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
