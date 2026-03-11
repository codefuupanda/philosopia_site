import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  // Session & identity
  sessionId: { type: String, required: true, index: true },

  // Event classification
  type: {
    type: String,
    required: true,
    enum: ['pageview', 'event', 'exit', 'heartbeat'],
    index: true,
  },

  // Page info
  page: { type: String, required: true },  // e.g. "/en/philosophers"
  referrer: { type: String, default: '' },

  // Event-specific data (for type: 'event')
  eventCategory: { type: String },  // e.g. "button", "link", "nav"
  eventAction: { type: String },    // e.g. "click"
  eventLabel: { type: String },     // e.g. "Read More - Aristotle"

  // Time tracking (for type: 'exit' or 'heartbeat')
  timeOnPage: { type: Number },     // milliseconds spent on page

  // Metadata
  userAgent: { type: String },
  language: { type: String },       // browser language
  screenWidth: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
analyticsEventSchema.index({ type: 1, timestamp: -1 });
analyticsEventSchema.index({ type: 1, page: 1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: 1 });

// TTL index: auto-delete events older than 90 days (adjust as needed)
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
