// src/lib/rate-limit.ts
// Production-grade rate limiting using Upstash Redis
// Falls back to in-memory when UPSTASH_REDIS_REST_URL is not configured

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Redis-backed rate limiter (production) ───
function createRedisLimiter(prefix: string, maxRequests: number, windowSec: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    prefix: `menupro:${prefix}`,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    analytics: true,
  });
}

// ─── In-memory fallback (development) ───
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryCheck(key: string, maxRequests: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetAt) memoryStore.delete(key);
    }
  }, 60_000);
}

// ─── Rate limiter instances ───
const redisOrderLimiter = createRedisLimiter("orders", 5, 60);      // 5 orders/min
const redisAnalyticsLimiter = createRedisLimiter("analytics", 30, 60); // 30 events/min
const redisRatingLimiter = createRedisLimiter("ratings", 2, 30);     // 2 ratings/30s
const redisAuthLimiter = createRedisLimiter("auth", 10, 60);        // 10 login attempts/min

// ─── Public API ───

export async function checkOrderRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (redisOrderLimiter) {
    const result = await redisOrderLimiter.limit(ip);
    return { success: result.success, remaining: result.remaining };
  }
  return inMemoryCheck(`order:${ip}`, 5, 60_000);
}

export async function checkAnalyticsRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (redisAnalyticsLimiter) {
    const result = await redisAnalyticsLimiter.limit(ip);
    return { success: result.success, remaining: result.remaining };
  }
  return inMemoryCheck(`analytics:${ip}`, 30, 60_000);
}

export async function checkRatingRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (redisRatingLimiter) {
    const result = await redisRatingLimiter.limit(ip);
    return { success: result.success, remaining: result.remaining };
  }
  return inMemoryCheck(`rating:${ip}`, 2, 30_000);
}

export async function checkAuthRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (redisAuthLimiter) {
    const result = await redisAuthLimiter.limit(ip);
    return { success: result.success, remaining: result.remaining };
  }
  return inMemoryCheck(`auth:${ip}`, 10, 60_000);
}
