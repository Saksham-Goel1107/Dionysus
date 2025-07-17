import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function checkAndSyncProStatus(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

  await db.user.update({
    where: { id: userId },
    data: { isPro: hasProPlan },
  });
}
