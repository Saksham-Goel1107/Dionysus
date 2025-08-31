import Battery from '@/app/components/Battery';
import { ModeToggle } from '@/app/components/ThemeToggle';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import PasswordGate from '@/components/PasswordGate';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { shouldRedirectToSurvey } from '@/lib/survey';
import { OrganizationSwitcher } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import AppSidebar from './_components/AppSidebar';
import ClientFeedbackForm from './_components/ClientFeedbackForm';
import CurrentTimeDisplay from './_components/CurrentTimeDisplay';
import RandomQuotes from './_components/RandomQuotes';
import UserButtonTutorial from './_components/UserButtonTutorial';
import ProCrownUserButtonWrapper from './ProCrownUserButtonWrapper';

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const { sessionClaims } = await auth();

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
            <RandomQuotes />
            <div className="ml-auto flex items-center justify-center gap-2">
              <div className="hidden items-center gap-2 sm:block md:flex">
                <OrganizationSwitcher />
              </div>
              <ModeToggle />
              <ProCrownUserButtonWrapper />
              <div className="hidden items-center gap-2 sm:block md:flex">
                <Battery />

                <a
                  href="https://www.buymeacoffee.com/saksham07"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    className="rounded-full"
                    src="/Coffee.png"
                    alt="Buy me a coffee"
                    width={40}
                    height={40}
                  />
                </a>
                <a
                  href="https://github.com/sponsors/Saksham-Goel1107"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Heart className="h-6 w-6 transition-all duration-200 group-hover:scale-125 group-hover:text-red-500" />
                </a>
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
        <UserButtonTutorial />
        <OnboardingChecklist />
      </SidebarProvider>
    </PasswordGate>
  );
};

export default Layout;
