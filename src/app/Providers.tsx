'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AiChatSidebar from './components/AiChatSidebar';
import AiToolkitButton from './components/AiButton';
import RecaptchaGate from './components/RecaptchaGate';

function Providers({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideAiChat = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/onboarding');

  return (
    <>
      {children}
      <RecaptchaGate>
      </RecaptchaGate>
      {!hideAiChat && <AiToolkitButton setIsSidebarOpen={setIsSidebarOpen} />}
      {!hideAiChat && (
        <AiChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            document.body.style.overflow = '';
          }}
        />
      )}
    </>
  );
}

export default Providers;
