type CacheEntry = { value: unknown; expiresAt: number };

const globalCache = globalThis as typeof globalThis & { __metricsCache?: Map<string, CacheEntry> };
const cache = globalCache.__metricsCache ?? new Map<string, CacheEntry>();
globalCache.__metricsCache = cache;

export async function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export async function setCached(key: string, value: unknown, ttlSeconds: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function clearCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}
