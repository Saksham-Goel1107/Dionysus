import { db } from '@/server/db';
import { userHasProPlan } from './check-pro-status';
import { readReplicaDb } from '@/server/read-replica-db';

export async function checkAndSyncProStatus(userId: string) {
  const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const hasProPlan = await userHasProPlan({ bypassCache: true });

  const completedTransactions = await readReplicaDb.stripeTransaction.findMany({
    where: {
      userId: userId,
      isCompleted: true,
    },
  });

  const totalPurchasedCredits = completedTransactions.reduce(
    (total, transaction) => total + (transaction.credits || 0),
    0,
  );

  const shouldBlock = user.credits > totalPurchasedCredits + 150;

  if (shouldBlock && !user.isBlocked) {
    await db.user.update({
      where: { id: userId },
      data: {
        isPro: hasProPlan,
        isBlocked: true,
      },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: {
        isPro: hasProPlan,
      },
    });
  }
}
