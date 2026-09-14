"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCached = setCached;
exports.clearCache = clearCache;
// Use `any` for the redis client to avoid requiring the `redis` package at compile
// time. We will attempt to load it dynamically at runtime only when `REDIS_URL`
// is present.
let redisClient = null;
const inMemoryCache = new Map();
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
            }).catch((err) => {
                console.warn('⚠️ Redis connect failed, falling back to in-memory cache', (err === null || err === void 0 ? void 0 : err.message) || err);
                redisClient = null;
            });
        }
        else {
            console.warn('⚠️ Redis package not found or unsupported; using in-memory cache');
            redisClient = null;
        }
    }
    catch (err) {
        console.warn('⚠️ Redis client init failed, using in-memory cache', (err === null || err === void 0 ? void 0 : err.message) || err);
        redisClient = null;
    }
}
function getCached(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (redisClient) {
            try {
                const raw = yield redisClient.get(key);
                if (!raw)
                    return null;
                return JSON.parse(raw);
            }
            catch (err) {
                console.warn('Redis GET failed, falling back to in-memory cache', (err === null || err === void 0 ? void 0 : err.message) || err);
                // fallback to in-memory below
            }
        }
        const entry = inMemoryCache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            inMemoryCache.delete(key);
            return null;
        }
        return entry.value;
    });
}
function setCached(key_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (key, value, ttlSeconds = 120) {
        if (redisClient) {
            try {
                yield redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
                return;
            }
            catch (err) {
                console.warn('Redis SET failed, falling back to in-memory cache', (err === null || err === void 0 ? void 0 : err.message) || err);
                // fallback to in-memory below
            }
        }
        const expiresAt = Date.now() + ttlSeconds * 1000;
        inMemoryCache.set(key, { value, expiresAt });
    });
}
function clearCache(key) {
    if (key) {
        inMemoryCache.delete(key);
        if (redisClient)
            redisClient.del(key).catch(() => { });
    }
    else {
        inMemoryCache.clear();
        if (redisClient)
            redisClient.flushAll().catch(() => { });
    }
}
