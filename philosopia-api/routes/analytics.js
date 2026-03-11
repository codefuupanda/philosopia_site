import express from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

const router = express.Router();

// ─── Collect Events ──────────────────────────────────────────────
// POST /api/analytics/events
// Accepts a single event or an array of events
router.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    if (events.length === 0 || events.length > 50) {
      return res.status(400).json({ message: 'Send between 1 and 50 events' });
    }

    const docs = events.map((e) => ({
      sessionId: String(e.sessionId || '').slice(0, 64),
      type: e.type,
      page: String(e.page || '').slice(0, 500),
      referrer: String(e.referrer || '').slice(0, 500),
      eventCategory: e.eventCategory ? String(e.eventCategory).slice(0, 100) : undefined,
      eventAction: e.eventAction ? String(e.eventAction).slice(0, 100) : undefined,
      eventLabel: e.eventLabel ? String(e.eventLabel).slice(0, 200) : undefined,
      timeOnPage: typeof e.timeOnPage === 'number' ? Math.min(e.timeOnPage, 3600000) : undefined,
      userAgent: req.headers['user-agent']?.slice(0, 300),
      language: String(e.language || '').slice(0, 10),
      screenWidth: typeof e.screenWidth === 'number' ? e.screenWidth : undefined,
      timestamp: new Date(),
    }));

    await AnalyticsEvent.insertMany(docs, { ordered: false });
    res.status(201).json({ received: docs.length });
  } catch (err) {
    console.error('Analytics ingest error:', err.message);
    res.status(500).json({ message: 'Failed to store events' });
  }
});

// ─── Dashboard Stats ─────────────────────────────────────────────
// GET /api/analytics/stats?days=7
router.get('/stats', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      pageViewsByPage,
      totalPageviews,
      avgTimeByPage,
      bounceData,
      exitPages,
      topEvents,
      dailyPageviews,
    ] = await Promise.all([
      // Page views per page
      AnalyticsEvent.aggregate([
        { $match: { type: 'pageview', timestamp: { $gte: since } } },
        { $group: { _id: '$page', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ]),

      // Total pageviews
      AnalyticsEvent.countDocuments({ type: 'pageview', timestamp: { $gte: since } }),

      // Average time on page (from exit events that have timeOnPage)
      AnalyticsEvent.aggregate([
        { $match: { type: 'exit', timeOnPage: { $gt: 0 }, timestamp: { $gte: since } } },
        { $group: { _id: '$page', avgTime: { $avg: '$timeOnPage' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Bounce rate: sessions with only 1 pageview
      AnalyticsEvent.aggregate([
        { $match: { type: 'pageview', timestamp: { $gte: since } } },
        { $group: { _id: '$sessionId', pageCount: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            bouncedSessions: { $sum: { $cond: [{ $eq: ['$pageCount', 1] }, 1, 0] } },
          },
        },
      ]),

      // Exit pages
      AnalyticsEvent.aggregate([
        { $match: { type: 'exit', timestamp: { $gte: since } } },
        { $group: { _id: '$page', exits: { $sum: 1 } } },
        { $sort: { exits: -1 } },
        { $limit: 10 },
      ]),

      // Top custom events
      AnalyticsEvent.aggregate([
        { $match: { type: 'event', timestamp: { $gte: since } } },
        {
          $group: {
            _id: { category: '$eventCategory', action: '$eventAction', label: '$eventLabel' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Daily pageview trend
      AnalyticsEvent.aggregate([
        { $match: { type: 'pageview', timestamp: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            views: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const bounce = bounceData[0] || { totalSessions: 0, bouncedSessions: 0 };
    const bounceRate = bounce.totalSessions > 0
      ? Math.round((bounce.bouncedSessions / bounce.totalSessions) * 100)
      : 0;

    res.json({
      period: { days, since },
      totalPageviews,
      bounceRate,
      totalSessions: bounce.totalSessions,
      pageViews: pageViewsByPage.map((p) => ({ page: p._id, views: p.views })),
      avgTimeOnPage: avgTimeByPage.map((p) => ({
        page: p._id,
        avgTimeMs: Math.round(p.avgTime),
        avgTimeSec: Math.round(p.avgTime / 1000),
        samples: p.count,
      })),
      exitPages: exitPages.map((p) => ({ page: p._id, exits: p.exits })),
      topEvents: topEvents.map((e) => ({ ...e._id, count: e.count })),
      dailyTrend: dailyPageviews.map((d) => ({ date: d._id, views: d.views })),
    });
  } catch (err) {
    console.error('Analytics stats error:', err.message);
    res.status(500).json({ message: 'Failed to compute stats' });
  }
});

export default router;
