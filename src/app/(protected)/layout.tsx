import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from '@/app/components/ThemeToggle';
import AppSidebar from './_components/AppSidebar';
import ClientFeedbackForm from './_components/ClientFeedbackForm';
import ProCrownUserButtonWrapper from './ProCrownUserButtonWrapper';
import CurrentTimeDisplay from './_components/CurrentTimeDisplay';
import { Inbox } from '@novu/nextjs';
import { auth } from '@clerk/nextjs/server';
import Battery from '@/app/components/Battery';
import { shouldRedirectToSurvey } from '@/lib/survey';
import { redirect } from 'next/navigation';

const PasswordGate = dynamic(() => import('@/components/PasswordGate'), {
  ssr: false,
});

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const { userId, sessionClaims } = await auth();

  if (!sessionClaims?.metadata?.onboardingComplete) {
    return redirect('/onboarding');
  }

  const shouldRedirect = await shouldRedirectToSurvey();
  if (shouldRedirect) {
    return redirect('/survey-check');
  }

  return (
    <PasswordGate>
      <SidebarProvider>
        <AppSidebar />
        <main className="m-2 w-full">
          <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar p-2 px-4 shadow">
            <SidebarTrigger />
            <CurrentTimeDisplay />
            <div className="ml-auto flex items-center gap-2 justify-center">
              <div className="dark:bg-gray-300">
                {userId && process.env.NEXT_PUBLIC_NOVU_KEY && (
                  <Inbox
                    applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_KEY}
                    subscriber={userId}
                  />
                )}
              </div>
              <ModeToggle />
              <ProCrownUserButtonWrapper />
              <div className="hidden sm:block">
                <Battery />
              </div>
            </div>
          </div>
          <div className="h-4"> </div>
          <div className="h-[calc(100vh-6rem)] overflow-y-scroll rounded-md border border-sidebar-border bg-sidebar p-4 shadow">
            {' '}
            {children}
          </div>
        </main>
        <ClientFeedbackForm />
      </SidebarProvider>
    </PasswordGate>
  );
};

export default Layout;
