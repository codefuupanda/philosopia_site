/**
 * Lightweight analytics tracker
 *
 * Auto-tracks: pageviews, time on page, exit pages
 * Manual tracking: tracker.event(category, action, label)
 *
 * Usage:
 *   import tracker from './utils/tracker';
 *   tracker.init();                          // call once on app mount
 *   tracker.event('button', 'click', 'CTA'); // track custom events
 */

const API_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api') + '/analytics/events';

// Generate a random session ID (persists for the tab's lifetime)
const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);

let pageEnteredAt = Date.now();
let currentPage = window.location.pathname;
let initialized = false;
let queue = [];
let flushTimer = null;

// ─── Helpers ────────────────────────────────────────────────────

function baseMeta() {
  return {
    sessionId,
    page: window.location.pathname,
    referrer: document.referrer,
    language: navigator.language,
    screenWidth: window.screen.width,
  };
}

function enqueue(event) {
  queue.push(event);
  // Flush after a short delay to batch rapid events
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 1000);
  }
}

function flush() {
  flushTimer = null;
  if (queue.length === 0) return;

  const events = queue.splice(0, 50);

  // Use sendBeacon if available (works during page unload), else fetch
  const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(API_URL, blob);
  } else {
    fetch(API_URL, { method: 'POST', body: blob, keepalive: true }).catch(() => {});
  }
}

// ─── Track functions ────────────────────────────────────────────

function trackPageview() {
  pageEnteredAt = Date.now();
  currentPage = window.location.pathname;
  enqueue({ ...baseMeta(), type: 'pageview' });
}

function trackExit() {
  const timeOnPage = Date.now() - pageEnteredAt;
  enqueue({ ...baseMeta(), page: currentPage, type: 'exit', timeOnPage });
  flush(); // flush immediately on exit
}

function trackEvent(category, action, label) {
  enqueue({
    ...baseMeta(),
    type: 'event',
    eventCategory: category,
    eventAction: action,
    eventLabel: label,
  });
}

// ─── SPA navigation tracking ───────────────────────────────────

function onRouteChange() {
  if (window.location.pathname === currentPage) return;

  // Send exit for the previous page
  const timeOnPage = Date.now() - pageEnteredAt;
  enqueue({ ...baseMeta(), page: currentPage, type: 'exit', timeOnPage });

  // Track new pageview
  trackPageview();
}

// ─── Init ───────────────────────────────────────────────────────

function init() {
  if (initialized) return;
  initialized = true;

  // Initial pageview
  trackPageview();

  // Listen for SPA navigation (React Router uses pushState/popstate)
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onRouteChange();
  };
  window.addEventListener('popstate', onRouteChange);

  // Track exit when user leaves
  window.addEventListener('beforeunload', trackExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackExit();
    }
  });
}

const tracker = { init, event: trackEvent };

export default tracker;
