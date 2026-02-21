/**
 * Client-side cache utility with:
 * - sessionStorage persistence with TTL
 * - In-flight request deduplication (prevents duplicate network calls)
 * - Stale-while-revalidate (show cached data immediately, refresh in background)
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory map of pending requests for deduplication
const pendingRequests = new Map();

/**
 * Get cached data from sessionStorage
 * Returns { data, isStale } or null if no cache entry exists
 */
export function getCache(key) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const { data, expiry } = JSON.parse(item);
    const isStale = Date.now() > expiry;

    // Return data even if stale (for SWR pattern) — caller decides what to do
    return { data, isStale };
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
 * Fetch with cache — stale-while-revalidate + request deduplication.
 *
 * - If fresh cache exists: return immediately, no network call.
 * - If stale cache exists: return stale data immediately, revalidate in background.
 * - If no cache: fetch from network (deduplicated).
 *
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns data
 * @param {number} ttl - Time to live in ms
 * @returns {Promise<{data: any, fromCache: boolean}>}
 */
export async function fetchWithCache(key, fetcher, ttl = DEFAULT_TTL) {
  const cached = getCache(key);

  // Fresh cache — return immediately
  if (cached && !cached.isStale) {
    return { data: cached.data, fromCache: true };
  }

  // Stale cache — return stale data, revalidate in background
  if (cached && cached.isStale) {
    // Fire off background revalidation (deduplicated)
    deduplicatedFetch(key, fetcher, ttl);
    return { data: cached.data, fromCache: true };
  }

  // No cache — must wait for network
  const data = await deduplicatedFetch(key, fetcher, ttl);
  return { data, fromCache: false };
}

/**
 * Deduplicated fetch: if the same key is already being fetched,
 * return the existing promise instead of firing a new request.
 */
function deduplicatedFetch(key, fetcher, ttl) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fetcher()
    .then(data => {
      setCache(key, data, ttl);
      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}
