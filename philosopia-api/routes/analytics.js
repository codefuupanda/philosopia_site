import express from 'express';
import { putEvents, queryLastDays } from '../db/analytics.js';

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

    const received = await putEvents(docs);
    res.status(201).json({ received });
  } catch (err) {
    console.error('Analytics ingest error:', err.message);
    res.status(500).json({ message: 'Failed to store events' });
  }
});

// ─── Dashboard Stats ─────────────────────────────────────────────
// GET /api/analytics/stats?days=7
// One Query per day partition, then the aggregations run in app code.
// Response shape is identical to the old Mongo aggregation version.
router.get('/stats', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = (await queryLastDays(days))
      .filter((e) => new Date(e.timestamp) >= since);

    const pageviews = events.filter((e) => e.type === 'pageview');
    const exits = events.filter((e) => e.type === 'exit');
    const custom = events.filter((e) => e.type === 'event');

    const countBy = (items, keyFn) => {
      const m = new Map();
      for (const it of items) {
        const k = keyFn(it);
        m.set(k, (m.get(k) || 0) + 1);
      }
      return m;
    };

    // Page views per page (top 20)
    const pageViews = [...countBy(pageviews, (e) => e.page)]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([page, views]) => ({ page, views }));

    // Average time on page (from exit events that have timeOnPage), top 20 by samples
    const timeAgg = new Map();
    for (const e of exits) {
      if (typeof e.timeOnPage === 'number' && e.timeOnPage > 0) {
        const agg = timeAgg.get(e.page) || { sum: 0, count: 0 };
        agg.sum += e.timeOnPage;
        agg.count += 1;
        timeAgg.set(e.page, agg);
      }
    }
    const avgTimeOnPage = [...timeAgg]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([page, { sum, count }]) => ({
        page,
        avgTimeMs: Math.round(sum / count),
        avgTimeSec: Math.round(sum / count / 1000),
        samples: count,
      }));

    // Bounce rate: sessions with only 1 pageview
    const bySession = countBy(pageviews, (e) => e.sessionId);
    const totalSessions = bySession.size;
    const bouncedSessions = [...bySession.values()].filter((n) => n === 1).length;
    const bounceRate = totalSessions > 0
      ? Math.round((bouncedSessions / totalSessions) * 100)
      : 0;

    // Exit pages (top 10)
    const exitPages = [...countBy(exits, (e) => e.page)]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, exits: count }));

    // Top custom events (top 20)
    const topEvents = [...countBy(custom, (e) =>
      JSON.stringify({ category: e.eventCategory, action: e.eventAction, label: e.eventLabel })
    )]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ ...JSON.parse(key), count }));

    // Daily pageview trend (ascending by date)
    const dailyTrend = [...countBy(pageviews, (e) => e.day)]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, views]) => ({ date, views }));

    res.json({
      period: { days, since },
      totalPageviews: pageviews.length,
      bounceRate,
      totalSessions,
      pageViews,
      avgTimeOnPage,
      exitPages,
      topEvents,
      dailyTrend,
    });
  } catch (err) {
    console.error('Analytics stats error:', err.message);
    res.status(500).json({ message: 'Failed to compute stats' });
  }
});

export default router;
