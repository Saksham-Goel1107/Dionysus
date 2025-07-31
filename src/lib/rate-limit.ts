import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

let redis: Redis | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

if (process.env.REDIS_URL_NEW) {
  try {
    redis = new Redis(process.env.REDIS_URL_NEW, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        return times >= 1 ? null : 200;
      },
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error, falling back to in-memory store:', err.message);
      redisEnabled = false;
    });

    redis.on('connect', () => {
      console.log('Successfully connected to Redis');
      redisEnabled = true;
    });
  } catch (err) {
    console.warn('Failed to initialize Redis, using in-memory store instead:', err);
    redis = null;
    redisEnabled = false;
  }
}

type RateLimitOptions = {
  limit: number;
  window: number;
  errorMessage?: string;
};

function getMemoryRateLimitStatus(identifier: string, limit: number, windowInSeconds: number) {
  const now = Date.now();
  const record = inMemoryStore.get(identifier) || {
    count: 0,
    expires: now + windowInSeconds * 1000,
  };

  if (now > record.expires) {
    record.count = 0;
    record.expires = now + windowInSeconds * 1000;
  }

  record.count += 1;
  inMemoryStore.set(identifier, record);

  return {
    isLimited: record.count > limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.expires,
  };
}

export async function rateLimit(req: NextRequest, key: string, options: RateLimitOptions) {
  const { limit, window: windowInSeconds, errorMessage = 'Too many requests' } = options;

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const identifier = `${key}:${ip}`;

  if (redis && redisEnabled) {
    try {
      return await redisRateLimit(identifier, limit, windowInSeconds, errorMessage);
    } catch (err: any) {
      console.warn(`Redis rate limit error, falling back to memory store: ${err.message || err}`);
      return memoryRateLimit(identifier, limit, windowInSeconds, errorMessage);
    }
  } else {
    return memoryRateLimit(identifier, limit, windowInSeconds, errorMessage);
  }
}

async function redisRateLimit(
  identifier: string,
  limit: number,
  windowInSeconds: number,
  errorMessage: string,
) {
  try {
    const current = await redis!.incr(identifier);

    if (current === 1) {
      await redis!.expire(identifier, windowInSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = Date.now() + windowInSeconds * 1000;

    const response = new NextResponse(
      JSON.stringify({
        success: current <= limit,
        limit,
        remaining,
        reset: resetTime,
        message: current > limit ? errorMessage : undefined,
      }),
      {
        status: current > limit ? 429 : 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(resetTime),
        },
      },
    );

    return {
      success: current <= limit,
      limit,
      remaining,
      response,
    };
  } catch (err: any) {
    console.warn(`Redis operation failed: ${err.message || err}`);
    throw err;
  }
}

function memoryRateLimit(
  identifier: string,
  limit: number,
  windowInSeconds: number,
  errorMessage: string,
) {
  const { isLimited, remaining, reset } = getMemoryRateLimitStatus(
    identifier,
    limit,
    windowInSeconds,
  );
  const success = !isLimited;

  const response = new NextResponse(
    JSON.stringify({
      success,
      limit,
      remaining,
      reset,
      message: isLimited ? errorMessage : undefined,
    }),
    {
      status: isLimited ? 429 : 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    },
  );

  return {
    success,
    limit,
    remaining,
    response,
  };
}

export async function withRateLimit(req: NextRequest, key: string, options: RateLimitOptions) {
  const result = await rateLimit(req, key, options);
  return result.success ? null : result.response;
}

export async function resetRateLimit(key: string) {
  if (redis && redisEnabled) {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Error in redis', err);
    }
  } else {
    inMemoryStore.delete(key);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowInSeconds: number,
): Promise<{ limited: boolean }> {
  if (redis && redisEnabled) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowInSeconds);
      }
      return { limited: current > limit };
    } catch (err: any) {
      console.warn(`Redis rate limit error, falling back to memory store: ${err.message || err}`);
      const { isLimited } = getMemoryRateLimitStatus(key, limit, windowInSeconds);
      return { limited: isLimited };
    }
  } else {
    const { isLimited } = getMemoryRateLimitStatus(key, limit, windowInSeconds);
    return { limited: isLimited };
  }
}

export function getRedisClient() {
  if (redis && redisEnabled) return redis;
  throw new Error('Redis is not enabled or not connected');
}
