import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from '@/app/components/ThemeToggle';
import AppSidebar from './_components/AppSidebar';
import ClientFeedbackForm from './_components/ClientFeedbackForm';
import ProCrownUserButtonWrapper from './ProCrownUserButtonWrapper';
import CurrentTimeDisplay from './_components/CurrentTimeDisplay';
import PasswordGate from '@/components/PasswordGate';
import { Inbox } from '@novu/nextjs';
import { useUser } from '@clerk/nextjs';

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const { user } = useUser();
  const userId = user?.id;
  return (
    <PasswordGate>
      <SidebarProvider>
        <AppSidebar />
        <main className="m-2 w-full">
          <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar p-2 px-4 shadow">
            <SidebarTrigger />
            <CurrentTimeDisplay />
            <div className="ml-auto flex items-center gap-2 justify-center">
            {userId && process.env.NEXT_PUBLIC_NOVU_KEY && (
              <Inbox
                applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_KEY}
                subscriber={userId}
              />
            )}
            <ModeToggle />
            <ProCrownUserButtonWrapper />
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
