import { db } from '@/server/db';
import { userHasProPlan } from './check-pro-status';
import { readReplicaDb } from '@/server/read-replica-db';

export async function checkAndSyncProStatus(userId: string) {
  const user = await readReplicaDb.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const hasProPlan = await userHasProPlan({ bypassCache: true });

  await db.user.update({
    where: { id: userId },
    data: { isPro: hasProPlan },
  });
}
