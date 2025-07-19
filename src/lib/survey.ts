import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/server/db';

/**
 * Check if the current user has completed the survey
 * @returns boolean indicating if the survey is completed
 */
export async function hasCompletedSurvey(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return false;
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { SurveyDone: true },
    });

    return !!dbUser?.SurveyDone;
  } catch (error) {
    console.error('Error checking survey status:', error);
    return false;
  }
}

/**
 * Check if the user should be redirected to the survey page
 * Criteria: User has completed onboarding but not the survey
 */
export async function shouldRedirectToSurvey(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return false;
    }

    // Check survey status from DB
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { SurveyDone: true },
    });

    // Check onboarding status from Clerk publicMetadata
    const onboardingComplete = user.publicMetadata?.onboardingComplete === true;

    // Redirect if onboarding is complete but survey is not
    return onboardingComplete && !dbUser?.SurveyDone;
  } catch (error) {
    console.error('Error checking redirect status:', error);
    return false;
  }
}
