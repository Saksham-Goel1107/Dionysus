import { db } from '@/server/db';
import { currentUser } from '@clerk/nextjs/server';

export async function checkAndSyncProStatus(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const clerkUser = await currentUser();
  if (!clerkUser) return;
  const hasProPlan =
    clerkUser.publicMetadata?.plan === 'dionysus_pro_pack' ||
    clerkUser.publicMetadata?.plan === 'dionysus_advance_pack';

  await db.user.update({
    where: { id: userId },
    data: { isPro: hasProPlan },
  });
}
