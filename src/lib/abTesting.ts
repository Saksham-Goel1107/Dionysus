import { clerkClient } from '@clerk/nextjs/server';
import { getFeatureFlagValue } from './configcat';

export async function getAbTestingSubscriberCount(): Promise<number> {
  try {
    const client = await clerkClient();

    let totalCount = 0;
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await client.users.getUserList({
        limit,
        offset,
      });

      const subscribersInBatch = response.data.filter((user) => {
        const metadata = user.publicMetadata || {};
        return metadata.abTestingOptIn === true;
      }).length;

      totalCount += subscribersInBatch;

      hasMore = response.data.length === limit;
      offset += limit;
    }

    return totalCount;
  } catch (error) {
    console.error('Error counting A/B testing subscribers:', error);
    return 0;
  }
}

export async function getAbTestingLimit(): Promise<number> {
  try {
    const limit = await getFeatureFlagValue('abtestingsubscriberlimit', 20);

    // Ensure we return a valid number
    if (typeof limit === 'number' && limit > 0) {
      return limit;
    }

    // Try to parse if it's a string
    if (typeof limit === 'string') {
      const parsed = parseInt(limit, 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : 20;
    }

    return 20;
  } catch (error) {
    console.error('Failed to get A/B testing limit from ConfigCat:', error);
    return 20;
  }
}
