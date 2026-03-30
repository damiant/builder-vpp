import { get, set } from "idb-keyval";

export type CachedMetrics = {
  data: unknown[];
  timestamp: number;
};

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const CACHE_PREFIX = "metrics-cache:";
const USERS_CACHE_PREFIX = "users-cache:";

/**
 * Generate a cache key based on company credentials and date range
 */
export function generateCacheKey(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
): string {
  // Create a simple hash of the credentials and dates
  const combined = `${publicKey}|${privateKey}|${startDate}|${endDate}`;
  // Use a simple hash to avoid very long keys
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached metrics if available and fresh
 */
export async function getCachedMetrics(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
): Promise<unknown[] | null> {
  try {
    const cacheKey = generateCacheKey(publicKey, privateKey, startDate, endDate);
    const cached = await get<CachedMetrics>(cacheKey);

    if (!cached || !Array.isArray(cached.data)) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is still fresh (less than 1 hour old)
    if (age < CACHE_DURATION_MS) {
      console.log(`Using cached metrics (${Math.round(age / 1000)}s old)`);
      return cached.data;
    }

    console.log("Cached metrics expired, fetching fresh data");
    return null;
  } catch (error) {
    console.error("Error reading from metrics cache:", error);
    return null;
  }
}

/**
 * Store metrics in cache
 */
export async function cacheMetrics(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
  data: unknown[],
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(publicKey, privateKey, startDate, endDate);
    const cached: CachedMetrics = {
      data,
      timestamp: Date.now(),
    };
    await set(cacheKey, cached);
    console.log("Metrics cached successfully");
  } catch (error) {
    console.error("Error writing to metrics cache:", error);
  }
}

/**
 * Generate a cache key for users data
 */
function generateUsersCacheKey(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
): string {
  const combined = `${publicKey}|${privateKey}|${startDate}|${endDate}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${USERS_CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached users data if available and fresh
 */
export async function getCachedUsers(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
): Promise<unknown[] | null> {
  try {
    const cacheKey = generateUsersCacheKey(publicKey, privateKey, startDate, endDate);
    const cached = await get<CachedMetrics>(cacheKey);

    if (!cached || !Array.isArray(cached.data)) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age < CACHE_DURATION_MS) {
      console.log(`Using cached users data (${Math.round(age / 1000)}s old)`);
      return cached.data;
    }

    console.log("Cached users data expired, fetching fresh data");
    return null;
  } catch (error) {
    console.error("Error reading from users cache:", error);
    return null;
  }
}

/**
 * Store users data in cache
 */
export async function cacheUsers(
  publicKey: string,
  privateKey: string,
  startDate: string,
  endDate: string,
  data: unknown[],
): Promise<void> {
  try {
    const cacheKey = generateUsersCacheKey(publicKey, privateKey, startDate, endDate);
    const cached: CachedMetrics = {
      data,
      timestamp: Date.now(),
    };
    await set(cacheKey, cached);
    console.log("Users data cached successfully");
  } catch (error) {
    console.error("Error writing to users cache:", error);
  }
}
