'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import AiChatSidebar from './components/AiChatSidebar';
import AiToolkitButton from './components/AiButton';
import RecaptchaGate from './components/RecaptchaGate';
import { useUser } from '@clerk/nextjs';
import { app, analytics, perf } from '@/firebase-init';

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

  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    let idleInstance: any;

    import('idle-js').then(({ default: IdleJs }) => {
      idleInstance = new IdleJs({
        idle: 10 * 60 * 1000,
        events: ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'],
        onIdle: () => {
          setShowInactivityModal(true);
          let c = 10;
          setCountdown(c);
          countdownTimer.current = setInterval(() => {
            c -= 1;
            setCountdown(c);
            if (c === 0) {
              clearInterval(countdownTimer.current!);
              window.location.href = 'https://google.com';
            }
          }, 1000);
        },
      });

      idleInstance.start();
    });

    return () => {
      if (idleInstance) idleInstance.stop();
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [userId]);

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

          {showInactivityModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm text-center shadow-xl">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                  Inactivity Detected
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Redirecting to Google in <span className="font-bold">{countdown}</span> seconds...
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  onClick={() => {
                    setShowInactivityModal(false);
                    setCountdown(10);
                    if (countdownTimer.current) clearInterval(countdownTimer.current);
                  }}
                >
                  Stop Redirect
                </button>
              </div>
            </div>
          )}
        </RecaptchaGate>
      ) : (
        children
      )}
    </>
  );
}

export default Providers;
