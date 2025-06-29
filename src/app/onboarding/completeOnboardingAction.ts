'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export const markOnboardingComplete = async () => {
  const { userId } = await auth();
  if (!userId) return { error: 'No user' };
  const client = await clerkClient();
  try {
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true },
    });
    return { message: 'ok' };
  } catch (err) {
    return { error: 'Failed to update onboarding status' };
  }
};
