type InMemoryEntry = { value: any; expiresAt: number };

// Use `any` for the redis client to avoid requiring the `redis` package at compile
// time. We will attempt to load it dynamically at runtime only when `REDIS_URL`
// is present.
let redisClient: any = null;
const inMemoryCache = new Map<string, InMemoryEntry>();

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    // Dynamically require `redis` so TypeScript compilation doesn't need the
    // dependency present. If `redis` isn't installed, we'll fall back to
    // in-memory cache.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redisPkg = require('redis');
    if (redisPkg && typeof redisPkg.createClient === 'function') {
      redisClient = redisPkg.createClient({ url: REDIS_URL });
      redisClient.connect().then(() => {
        console.log('✅ Connected to Redis for metrics caching');
      }).catch((err: any) => {
        console.warn('⚠️ Redis connect failed, falling back to in-memory cache', err?.message || err);
        redisClient = null;
      });
    } else {
      console.warn('⚠️ Redis package not found or unsupported; using in-memory cache');
      redisClient = null;
    }
  } catch (err: any) {
    console.warn('⚠️ Redis client init failed, using in-memory cache', err?.message || err);
    redisClient = null;
  }
}

export async function getCached(key: string): Promise<any | null> {
  if (redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Redis GET failed, falling back to in-memory cache', (err as any)?.message || err);
      // fallback to in-memory below
    }
  }

  const entry = inMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(key);
    return null;
  }
  return entry.value;
}

export async function setCached(key: string, value: any, ttlSeconds = 120): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch (err) {
      console.warn('Redis SET failed, falling back to in-memory cache', (err as any)?.message || err);
      // fallback to in-memory below
    }
  }

  const expiresAt = Date.now() + ttlSeconds * 1000;
  inMemoryCache.set(key, { value, expiresAt });
}

export function clearCache(key?: string) {
  if (key) {
    inMemoryCache.delete(key);
    if (redisClient) redisClient.del(key).catch(() => {});
  } else {
    inMemoryCache.clear();
    if (redisClient) redisClient.flushAll().catch(() => {});
  }
}
