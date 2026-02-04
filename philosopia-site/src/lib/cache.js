/**
 * Client-side sessionStorage cache utility
 *
 * - Reads from sessionStorage if available
 * - Falls back to network request if not cached
 * - Updates cache when fresh data is fetched
 * - TTL-based expiration
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data from sessionStorage
 */
export function getCache(key) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const { data, expiry } = JSON.parse(item);

    if (Date.now() > expiry) {
      sessionStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Set data in sessionStorage with TTL
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      expiry: Date.now() + ttl
    }));
  } catch (e) {
    // sessionStorage might be full or disabled
    console.warn('Cache write failed:', e.message);
  }
}

/**
 * Clear specific cache key
 */
export function clearCache(key) {
  sessionStorage.removeItem(key);
}

/**
 * Clear all cache keys matching a prefix
 */
export function clearCachePrefix(prefix) {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(prefix)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Fetch with cache - tries cache first, falls back to network
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns data
 * @param {number} ttl - Time to live in ms
 * @returns {Promise<{data: any, fromCache: boolean}>}
 */
export async function fetchWithCache(key, fetcher, ttl = DEFAULT_TTL) {
  // Try cache first
  const cached = getCache(key);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // Fetch from network
  const data = await fetcher();

  // Update cache
  setCache(key, data, ttl);

  return { data, fromCache: false };
}
