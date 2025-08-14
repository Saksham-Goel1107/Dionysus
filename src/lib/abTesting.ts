import { clerkClient } from '@clerk/nextjs/server';

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

export function getAbTestingLimit(): number {
  const limit = process.env.AB_TESTING_SUBSCRIBER_LIMIT;
  return limit ? parseInt(limit, 10) : 20;
}
