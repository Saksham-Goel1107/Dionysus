'use client';

import { useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import AiChatSidebar from './components/AiChatSidebar';
import AiToolkitButton from './components/AiButton';
import RecaptchaGate from './components/RecaptchaGate';
import { useUser } from '@clerk/nextjs';

function Providers({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const userId = user?.user?.id;
  const userData = user?.user;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideAiChat =
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/onboarding');

  return (
    <>
      {userId ? (
        <RecaptchaGate>
          {children}
          {userData && (
            <Script
              id="userback"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
      window.Userback = window.Userback || {};
      Userback.access_token = "${process.env.NEXT_PUBLIC_USERBACK_ACCESS_TOKEN}";
      (async function() {
        try {
        Userback.user_data = {
          id: "${userId}",
          info: {
          name: "${userData.firstName || userData.lastName || userData?.emailAddresses?.[0]?.emailAddress || 'User'}",
          email: "${userData?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}"
          }
        };
        } catch (e) {
        Userback.user_data = {
          id: "${userId}",
          info: {
          name: 'User',
          email: 'user@example.com'
          }
        };
        }
      })();
      (function(d) {
        var s = d.createElement('script');s.async = true;s.src = 'https://static.userback.io/widget/v1.js';(d.head || d.body).appendChild(s);
      })(document);
                `,
              }}
            />
          )}
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
        </RecaptchaGate>
      ) : (
        children
      )}
    </>
  );
}

export default Providers;
