import { sendLowCreditsEmail } from './email';
import { db } from '../server/db';

/**
 * Checks if the user's credits are below 30 and sends a low credits email if not already sent.
 * @param userId The user's ID
 * @param userEmail The user's email
 * @param userName The user's name (optional)
 * @param credits The user's current credits
 * @param discounts Array of discount descriptions (optional)
 */
export async function checkAndSendLowCreditsAlert({
  userId,
  userEmail,
  userName,
  credits,
  discounts = [],
}: {
  userId: string;
  userEmail: string;
  userName?: string;
  credits: number;
  discounts?: string[];
}) {
  if (credits >= 30) return;
  // Check if already sent
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.lowCreditsEmailSent) return;

  await sendLowCreditsEmail({
    to: userEmail,
    name: userName,
    credits,
    discounts,
  });
  // Mark as sent
  await db.user.update({
    where: { id: userId },
    data: { lowCreditsEmailSent: true },
  });
}
