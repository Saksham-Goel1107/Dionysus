import { auth } from '@clerk/nextjs/server';
import { getCachedData, cacheData } from '@/lib/user-cache';
import { getUserProStatusCacheKey } from './pro-status-helpers';

/**
 * Helper function to check and update user pro status in cache
 * @returns True if user is a pro, false otherwise
 */
export async function checkAndUpdateUserProStatus(): Promise<boolean> {
  const { userId, has } = await auth();

  if (!userId) {
    return false;
  }

  const cacheKey = getUserProStatusCacheKey(userId);

  const isPro = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

  const cachedValue = await getCachedData<boolean>(cacheKey);

  if (cachedValue !== isPro) {
    await cacheData(cacheKey, isPro, 3600); // Cache for 1 hour
  }

  return isPro;
}
