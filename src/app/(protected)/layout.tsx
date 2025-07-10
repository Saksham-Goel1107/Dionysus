import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from '@/app/components/ThemeToggle';
import AppSidebar from './_components/AppSidebar';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import ProCrownUserButtonWrapper from './ProCrownUserButtonWrapper';
import CurrentTimeDisplay from './_components/CurrentTimeDisplay';
import PasswordGate from '@/components/PasswordGate';

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <PasswordGate>
      <SidebarProvider>
        <AppSidebar />
        <main className="m-2 w-full">
          <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar p-2 px-4 shadow">
            <SidebarTrigger />
            <CurrentTimeDisplay />
            <div className="ml-auto flex items-center gap-2 justify-center">
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
        <FeedbackForm />
      </SidebarProvider>
    </PasswordGate>
  );
};

export default layout;
