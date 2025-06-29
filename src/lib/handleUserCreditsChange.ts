import { checkAndSendLowCreditsAlert } from '@/lib/creditsAlert';

export async function handleUserCreditsChange({
  userId,
  userEmail,
  userName,
  credits,
  discounts = [],
  prisma,
}: {
  userId: string;
  userEmail: string;
  userName?: string;
  credits: number;
  discounts?: string[];
  prisma: any;
}) {
  // If credits > 30 and alert was sent, reset the flag
  if (credits > 30) {
    await prisma.user.update({
      where: { id: userId },
      data: { lowCreditsEmailSent: false },
    });
    return;
  }
  // If credits < 30, check and send alert
  await checkAndSendLowCreditsAlert({
    userId,
    userEmail,
    userName,
    credits,
    discounts,
  });
}
