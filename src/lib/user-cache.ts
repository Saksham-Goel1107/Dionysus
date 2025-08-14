import { Redis } from 'ioredis';

let redisFactory: (() => Promise<Redis>) | null = null;
const inMemoryStore: Map<string, { value: any; expires: number }> = new Map();
let redisEnabled = false;
let lastConnectionAttempt = 0;
const CONNECTION_RETRY_DELAY_MS = 10000;

function isRedisAvailable() {
  return redisEnabled && !!redisFactory;
}

async function getRedisClient(): Promise<Redis | null> {
  if (!redisFactory) return null;

  try {
    return await redisFactory();
  } catch (error) {
    console.warn('Failed to get Redis client:', error);
    return null;
  }
}

// Initialize Redis connection factory
async function setupRedisFactory() {
  // Don't try to reconnect too frequently
  const now = Date.now();
  if (now - lastConnectionAttempt < CONNECTION_RETRY_DELAY_MS) {
    return redisEnabled;
  }

  lastConnectionAttempt = now;

  if (process.env.REDIS_URL_NEW) {
    try {
      const redisUrl = process.env.REDIS_URL_NEW;

      redisFactory = async () => {
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          enableOfflineQueue: false,
          enableReadyCheck: true,
          keepAlive: 10000,
          family: 0,
          autoResubscribe: false,
          autoResendUnfulfilledCommands: false,
          lazyConnect: true,
          retryStrategy: (times) => {
            return times > 1 ? null : 500;
          },
        });

        if (client.status !== 'ready') {
          try {
            await client.connect();
          } catch (err) {
            client.disconnect();
            throw err;
          }
        }

        return client;
      };

      const testClient = await redisFactory();
      const pingResult = await Promise.race([
        testClient.ping(),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000)),
      ]);

      if (pingResult === 'PONG') {
        console.log('Successfully verified Redis connection');
        redisEnabled = true;
      } else {
        console.warn('Redis ping test failed, falling back to in-memory store');
        redisEnabled = false;
      }

      // Clean up test client
      testClient.disconnect();
    } catch (err) {
      console.warn('Failed to initialize Redis, using in-memory store instead:', err);
      redisFactory = null;
      redisEnabled = false;
    }
  }

  return redisEnabled;
}

setupRedisFactory().catch((err) => {
  console.warn('Failed to initialize Redis factory, using in-memory store instead:', err);
  redisEnabled = false;
});

/**
 * Caches data in Redis (or in-memory if Redis is not available)
 * @param key The cache key
 * @param value The value to cache
 * @param ttlSeconds Time-to-live in seconds
 */
export async function cacheData(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (isRedisAvailable()) {
    try {
      const client = await getRedisClient();
      if (client) {
        await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        client.disconnect();
      } else {
        setMemoryCache(key, value, ttlSeconds);
      }
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
  if (isRedisAvailable()) {
    try {
      // Get a fresh client
      const client = await getRedisClient();
      if (client) {
        const data = await client.get(key);
        client.disconnect();
        return data ? JSON.parse(data) : null;
      }
      return getMemoryCache(key);
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

export async function invalidateCache(key: string): Promise<void> {
  if (isRedisAvailable()) {
    try {
      const client = await getRedisClient();
      if (client) {
        await client.del(key);
        client.disconnect();
      } else {
        inMemoryStore.delete(key);
      }
    } catch (error) {
      console.warn('Redis cache invalidation error:', error);
      inMemoryStore.delete(key);
    }
  } else {
    inMemoryStore.delete(key);
  }
}
