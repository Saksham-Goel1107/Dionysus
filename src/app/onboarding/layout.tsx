import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasCompletedSurvey } from '@/lib/survey';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata.onboardingComplete === true) {
    const surveyDone = await hasCompletedSurvey();
    if (!surveyDone) {
      redirect('/survey-check');
    }
    redirect('/dashboard');
  }

  return <>{children}</>;
}
