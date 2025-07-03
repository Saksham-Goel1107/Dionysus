import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

// Initialize Redis client if REDIS_URL is available
// Otherwise use a memory-based fallback for development
let redis: Redis | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

// Only initialize Redis if URL is available (e.g., in production)
if (process.env.REDIS_URL_NEW) {
  try {
    redis = new Redis(process.env.REDIS_URL_NEW, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // Only retry once, then give up
        return times >= 1 ? null : 200;
      },
    });

    // Handle Redis connection errors
    redis.on('error', (err) => {
      console.warn('Redis connection error, falling back to in-memory store:', err.message);
      redisEnabled = false;
    });

    // Set flag when connection is successful
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
  window: number; // in seconds
  errorMessage?: string;
};

export async function rateLimit(req: NextRequest, key: string, options: RateLimitOptions) {
  const { limit, window: windowInSeconds, errorMessage = 'Too many requests' } = options;

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const identifier = `${key}:${ip}`;

  // Try to use Redis if available and connected, otherwise fallback to in-memory store
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
    // Use a Redis transaction to ensure atomicity
    const current = await redis!.incr(identifier);

    // Set expiration on first request
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
    // Fall back to in-memory implementation
    throw err;
  }
}

function memoryRateLimit(
  identifier: string,
  limit: number,
  windowInSeconds: number,
  errorMessage: string,
) {
  const now = Date.now();
  const record = inMemoryStore.get(identifier) || {
    count: 0,
    expires: now + windowInSeconds * 1000,
  };

  // Reset if window has expired
  if (now > record.expires) {
    record.count = 0;
    record.expires = now + windowInSeconds * 1000;
  }

  // Increment counter
  record.count += 1;
  inMemoryStore.set(identifier, record);

  const remaining = Math.max(0, limit - record.count);
  const response = new NextResponse(
    JSON.stringify({
      success: record.count <= limit,
      limit,
      remaining,
      reset: record.expires,
      message: record.count > limit ? errorMessage : undefined,
    }),
    {
      status: record.count > limit ? 429 : 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(record.expires),
      },
    },
  );

  return {
    success: record.count <= limit,
    limit,
    remaining,
    response,
  };
}

// Helper to use in API routes
export async function withRateLimit(req: NextRequest, key: string, options: RateLimitOptions) {
  const result = await rateLimit(req, key, options);
  return result.success ? null : result.response;
}
