import { auth } from '@clerk/nextjs/server';
import { getCachedData, cacheData } from './user-cache';
import { getUserProStatusCacheKey } from './pro-status-helpers';

/**
 * Checks if the authenticated user has a pro plan, with Redis caching
 * @param options Optional settings for the check
 * @returns Boolean indicating if the user has a pro plan, false if not authenticated
 */
export async function userHasProPlan(
  options: {
    bypassCache?: boolean;
    ttlSeconds?: number;
    advancedOnly?: boolean;
  } = {},
) {
  const { userId, has } = await auth();

  if (!userId) {
    return false;
  }

  const { bypassCache = false, ttlSeconds = 3600, advancedOnly = false } = options;

  const cacheKey = getUserProStatusCacheKey(userId);

  let hasProPlan: boolean;

  if (bypassCache) {
    hasProPlan = advancedOnly
      ? has({ plan: 'dionysus_advance_pack' })
      : has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

    await cacheData(cacheKey, hasProPlan, ttlSeconds);
  } else {
    const cachedValue = await getCachedData<boolean>(cacheKey);

    if (cachedValue === null) {
      hasProPlan = advancedOnly
        ? has({ plan: 'dionysus_advance_pack' })
        : has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

      await cacheData(cacheKey, hasProPlan, ttlSeconds);
    } else {
      hasProPlan = cachedValue;

      Promise.resolve()
        .then(async () => {
          const freshStatus = advancedOnly
            ? has({ plan: 'dionysus_advance_pack' })
            : has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

          if (freshStatus !== hasProPlan) {
            await cacheData(cacheKey, freshStatus, ttlSeconds);
          }
        })
        .catch((err) => console.error('Background cache refresh failed:', err));
    }
  }

  return hasProPlan;
}
