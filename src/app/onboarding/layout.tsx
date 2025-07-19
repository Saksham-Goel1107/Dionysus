import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSurveyStatus } from '@/lib/survey';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if ((await auth()).sessionClaims?.metadata.onboardingComplete === true) {
    const surveyStatus = await getSurveyStatus(userId ?? '');
      if (!surveyStatus.SurveyDone) {
        redirect('/survey-check');
      }
    redirect('/dashboard');
  }

  return <>{children}</>;
}
