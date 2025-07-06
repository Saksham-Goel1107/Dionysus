'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AiChatSidebar from './components/AiChatSidebar';
import AiToolkitButton from './components/AiButton';

function Providers({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideAiChat = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

  return (
    <>
      {children}
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
