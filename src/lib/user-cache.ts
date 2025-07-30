import { Redis } from 'ioredis';

let redis: Redis | null = null;
const inMemoryStore: Map<string, { value: any; expires: number }> = new Map();
let redisEnabled = false;

// Initialize Redis connection
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

/**
 * Caches data in Redis (or in-memory if Redis is not available)
 * @param key The cache key
 * @param value The value to cache
 * @param ttlSeconds Time-to-live in seconds
 */
export async function cacheData(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (redis && redisEnabled) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.warn('Redis cache set error, falling back to memory store:', error);
      setMemoryCache(key, value, ttlSeconds);
    }
  } else {
    setMemoryCache(key, value, ttlSeconds);
  }
}

/**
 * Gets cached data from Redis (or in-memory if Redis is not available)
 * @param key The cache key
 * @returns The cached value or null if not found
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (redis && redisEnabled) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Redis cache get error, falling back to memory store:', error);
      return getMemoryCache(key);
    }
  } else {
    return getMemoryCache(key);
  }
}

function setMemoryCache(key: string, value: any, ttlSeconds: number): void {
  const expires = Date.now() + ttlSeconds * 1000;
  inMemoryStore.set(key, { value, expires });

  setTimeout(() => {
    inMemoryStore.delete(key);
  }, ttlSeconds * 1000);
}

function getMemoryCache<T>(key: string): T | null {
  const item = inMemoryStore.get(key);

  if (!item) {
    return null;
  }

  if (item.expires < Date.now()) {
    inMemoryStore.delete(key);
    return null;
  }

  return item.value;
}

export function getRedisClient(): Redis | null {
  return redis;
}

export async function invalidateCache(key: string): Promise<void> {
  if (redis && redisEnabled) {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn('Redis cache invalidation error:', error);
      inMemoryStore.delete(key);
    }
  } else {
    inMemoryStore.delete(key);
  }
}
