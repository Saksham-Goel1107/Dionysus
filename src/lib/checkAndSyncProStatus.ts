import { db } from '@/server/db';
import { userHasProPlan } from './check-pro-status';
import { readReplicaDb } from '@/server/read-replica-db';

async function updateClerkPublicMetadata(userId: string, newMetadata: object) {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) throw new Error('Missing Clerk secret key');

  const currentRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!currentRes.ok) {
    throw new Error(`Failed to fetch Clerk user: ${await currentRes.text()}`);
  }

  const currentUser = await currentRes.json();
  const existingMetadata = currentUser.public_metadata || {};

  const mergedMetadata = { ...existingMetadata, ...newMetadata };

  const res = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_metadata: mergedMetadata }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update Clerk metadata: ${await res.text()}`);
  }

  return await res.json();
}

export async function checkAndSyncProStatus(userId: string) {
  const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const hasProPlan = await userHasProPlan({ bypassCache: true });

  const completedTransactions = await readReplicaDb.stripeTransaction.findMany({
    where: { userId, isCompleted: true },
  });

  const totalPurchasedCredits = completedTransactions.reduce(
    (total, transaction) => total + (transaction.credits || 0),
    0,
  );

  const shouldBlock = user.credits > totalPurchasedCredits + 150;

  await db.user.update({
    where: { id: userId },
    data: { isPro: hasProPlan },
  });

  if (shouldBlock) {
    await updateClerkPublicMetadata(userId, { isBlocked: shouldBlock });
  }
}
