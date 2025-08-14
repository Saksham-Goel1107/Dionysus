import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

let redis: Redis | null = null;
const inMemoryStore: Map<string, { count: number; expires: number }> = new Map();
let redisEnabled = false;

if (process.env.REDIS_URL || process.env.REDIS_URL_NEW) {
  try {
    let redisUrl = process.env.REDIS_URL || process.env.REDIS_URL_NEW || '';

    try {
      redisUrl = decodeURIComponent(redisUrl).trim();
    } catch {
      redisUrl = redisUrl.replace(/%20/g, ' ').trim();
    }

    let redisHost: string | null = null;
    try {
      const parsedUrl = new URL(redisUrl);
      redisHost = parsedUrl.hostname;
    } catch (e) {
      console.error('Failed to parse Redis URL:', e);
      const hostMatch = redisUrl.match(/\/\/([^@\/:]+@)?([^:\/?#]+)/);
      if (hostMatch && hostMatch[2]) {
        redisHost = hostMatch[2];
      }
    }
    if (redisHost && (redisHost === 'upstash.io' || redisHost.endsWith('.upstash.io'))) {
      if (redisUrl.includes('--tls') || redisUrl.includes('-u')) {
        const redisUrlMatch = redisUrl.match(/(redis:\/\/.*?@.*?:[0-9]+)/);
        if (redisUrlMatch && redisUrlMatch[1]) {
          redisUrl = redisUrlMatch[1];
        }
      }

      if (!redisUrl.startsWith('redis://') && redisUrl.includes('redis://')) {
        redisUrl = redisUrl.substring(redisUrl.indexOf('redis://'));
      }
    }
    console.log(
      'Attempting to connect to Redis with URL:',
      redisUrl.replace(/redis:\/\/.*?@/, 'redis://***:***@'),
    ); // Log sanitized URL

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      keepAlive: 10000,
      family: 0,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return 2;
        }
        return 1;
      },
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn(
            `Redis connection failed after ${times} attempts, falling back to in-memory store`,
          );
          return null;
        }
        const delay = Math.min(times * 500, 5000);
        console.log(`Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
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

type MockRedisClient = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, duration?: number) => Promise<string>;
  del: (key: string) => Promise<number>;
  exists: (key: string) => Promise<number>;
  ttl: (key: string) => Promise<number>;
};

function createMockRedisClient(): Redis {
  console.log('Using in-memory store instead of Redis');

  const mockClient: MockRedisClient = {
    async incr(key: string) {
      const now = Date.now();
      const record = inMemoryStore.get(key) || { count: 0, expires: now + 3600 * 1000 }; // Default 1 hour expiry

      if (now > record.expires) {
        record.count = 0;
        record.expires = now + 3600 * 1000;
      }

      record.count += 1;
      inMemoryStore.set(key, record);
      return record.count;
    },

    async expire(key: string, seconds: number) {
      const record = inMemoryStore.get(key);
      if (record) {
        record.expires = Date.now() + seconds * 1000;
        inMemoryStore.set(key, record);
      }
      return 1;
    },

    async get(key: string) {
      return inMemoryStore.get(key)?.count?.toString() || null;
    },

    async set(key: string, value: string, mode?: string, duration?: number) {
      let expiry = Date.now() + 3600 * 1000;
      if (duration) {
        expiry = Date.now() + duration * 1000;
      }

      let countValue = 0;
      if (typeof value === 'string') {
        try {
          countValue = parseInt(value, 10);
        } catch {
          countValue = 1;
        }
      } else if (typeof value === 'number') {
        countValue = value;
      }

      inMemoryStore.set(key, { count: countValue, expires: expiry });
      return 'OK';
    },

    async del(key: string) {
      inMemoryStore.delete(key);
      return 1;
    },

    async exists(key: string) {
      return inMemoryStore.has(key) ? 1 : 0;
    },

    async ttl(key: string) {
      const record = inMemoryStore.get(key);
      if (!record) return -2;
      const ttl = Math.floor((record.expires - Date.now()) / 1000);
      return ttl > 0 ? ttl : -1;
    },
  };

  return mockClient as unknown as Redis;
}

export function getRedisClient() {
  if (redis && redisEnabled) return redis;

  return createMockRedisClient();
}
