import { invalidateCache } from '@/lib/user-cache';

/**
 * Invalidates the user pro status cache
 * @param userId The user ID to invalidate the cache for
 */
export async function invalidateUserProStatusCache(userId: string): Promise<void> {
  const cacheKey = `user-pro-status:${userId}`;
  await invalidateCache(cacheKey);
}

/**
 * Creates a cache key for user pro status
 * @param userId The user ID to create a cache key for
 */
export function getUserProStatusCacheKey(userId: string): string {
  return `user-pro-status:${userId}`;
}
