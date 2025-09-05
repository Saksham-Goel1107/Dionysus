'use client';

import { app } from '@/firebase-init';
import { useClientVersionCheck } from '@/lib/clientVersionCheck';
import { useUser } from '@clerk/nextjs';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import AiToolkitButton from './components/AiButton';
import AiChatSidebar from './components/AiChatSidebar';
import CookieBanner from './components/CookieBanner';
import RecaptchaGate from './components/RecaptchaGate';
import LogRocket from 'logrocket';
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_LOGROCKET_KEY) {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_KEY);
}

declare global {
  interface Window {
    __translateReady?: boolean;
  }
}

function Providers({ children }: { children: React.ReactNode }) {
  useClientVersionCheck();
  const user = useUser();
  const userId = user?.user?.id;
  const userData = user?.user;
  const [isAbTester, setIsAbTester] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.user && process.env.NODE_ENV === 'production') {
      LogRocket.identify(user.user.id, {
        name: user.user.fullName || 'Anonymus',
        email: user.user.primaryEmailAddress?.emailAddress || 'anonymus@example.com',
      });
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const analytics = getAnalytics(app);
        logEvent(analytics, 'page_view');
        getPerformance(app);
      } catch (e) {
        console.error('Error in firebase working', e);
      }
    }
  }, []);
  useEffect(() => {
    if (!userId) return;
    const sync = async () => {
      try {
        await fetch('/api/sync-pro-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error('Failed to sync pro status', error);
      }
    };
    sync();

    fetch('/api/ab-testing/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.abTestingOptIn) setIsAbTester(true);
        else setIsAbTester(false);
      })
      .catch(() => setIsAbTester(false));
  }, [userId]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const hideAiChat =
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/onboarding') ||
    process.env.NODE_ENV !== 'production';

  const hideCookieBanner =
    pathname === '/updates' ||
    pathname === '/cookie-policy' ||
    process.env.NODE_ENV !== 'production';

  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const [isTranslateReady, setIsTranslateReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const translateTabStyle = {
    position: 'fixed' as 'fixed',
    bottom: 80,
    right: 0,
    zIndex: 10000,
    background: '#4285f4',
    color: '#fff',
    borderRadius: '8px 0 0 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    width: 40,
    height: 125,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    writingMode: 'vertical-rl' as 'vertical-rl',
    textAlign: 'center' as 'center',
    fontWeight: 600,
    fontSize: '1rem',
    letterSpacing: '0.05em',
  };

  const translateWidgetStyle = {
    position: 'fixed' as 'fixed',
    bottom: 80,
    right: 48,
    zIndex: 9999,
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    padding: '12px 16px',
    minWidth: '220px',
    maxWidth: '340px',
    fontSize: '1rem',
    color: '#222',
    border: '1px solid #ccc',
    display: showTranslate && isTranslateReady ? 'block' : 'none',
    visibility: (isTranslateReady ? 'visible' : 'hidden') as React.CSSProperties['visibility'], // Always render, hide until ready
  };

  return (
    <>
      {isAbTester && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
          className="flex items-center gap-2"
        >
          <span
            className="cursor-default rounded border border-white/10 bg-purple-700/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
            style={{ letterSpacing: '0.08em', lineHeight: 1 }}
          >
            A/B Tester
          </span>
          <button
            onClick={() => router.push('/alpha-help')}
            className="cursor-pointer rounded border border-white/10 bg-purple-700/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-purple-600"
            style={{ letterSpacing: '0.08em', lineHeight: 1 }}
          >
            A/B Support
          </button>
        </div>
      )}

      {process.env.NODE_ENV === 'production' && (
        <>
          <div style={translateTabStyle} onClick={() => setShowTranslate((v) => !v)}>
            Language
            <span style={{ fontSize: 18, marginTop: 8 }}>🌐</span>
          </div>

          <style>{`
            #google_translate_element,
            #google_translate_element *,
            .goog-te-menu-value,
            .goog-te-gadget,
            .goog-te-combo,
            .goog-te-menu-frame,
            .goog-te-menu2,
            .goog-te-menu2-item,
            .goog-te-menu2-item div {
              color: #222 !important;
              background: #fff !important;
              border-color: #ccc !important;
            }

            /* Fix size and appearance */
            .goog-te-gadget {
              font-size: 0.9rem !important;
              margin: 0 !important;
            }

            .goog-te-gadget-simple {
              padding: 4px 8px !important;
              border-radius: 4px !important;
              border: 1px solid #ccc !important;
            }

            /* Only show when ready */
            #google_translate_element:empty {
              display: none !important;
            }
          `}</style>

          <div id="google_translate_element" style={translateWidgetStyle}></div>

          <Script id="google-translate-init" strategy="afterInteractive">
            {`
                function googleTranslateElementInit() {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,fr,es,de,it,ru,zh-CN,ja,ko,ar,pt,hi,tr,pl,nl,sv,el,he,th,vi,uk,fa,ro,cs,hu,da,fi,sk,bg,hr,lt,lv,et,sl,ms,id,tl,ca,sr',
                    layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL
                  }, 'google_translate_element');
                  window.__translateReady = true;
                }
                if (typeof google !== 'undefined' && google.translate) {
                  googleTranslateElementInit();
                }
              `}
          </Script>
          <Script
            src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            strategy="afterInteractive"
            onLoad={() => {
              const checkReady = () => {
                if (window.__translateReady) {
                  setIsTranslateReady(true);
                } else {
                  setTimeout(checkReady, 50);
                }
              };
              checkReady();
            }}
          />
        </>
      )}
      <CookieBanner isVisible={!hideCookieBanner} />
      <div>
        <RecaptchaGate>
          {children}
          {process.env.NODE_ENV === 'production' && isClient && userData && userId && (
            <Script id="userback" strategy="afterInteractive">{`
      window.Userback = window.Userback || {};
      Userback.access_token = "${process.env.NEXT_PUBLIC_USERBACK_ACCESS_TOKEN?.replace(/["'<>&]/g, '')}";
      (async function() {
        try {
          Userback.user_data = {
            id: "${userId?.replace(/["'<>&]/g, '')}",
            info: {
              name: "${(userData.firstName || userData.lastName || userData?.emailAddresses?.[0]?.emailAddress || 'User').replace(/["'<>&]/g, '')}",
              email: "${(userData?.emailAddresses?.[0]?.emailAddress || 'user@example.com').replace(/["'<>&]/g, '')}"
            },
            abTester: ${isAbTester ? 'true' : 'false'}
          };
        } catch (e) {
          Userback.user_data = {
            id: "${userId?.replace(/["'<>&]/g, '')}",
            info: {
              name: 'User',
              email: 'user@example.com'
            },
            abTester: ${isAbTester ? 'true' : 'false'}
          };
        }
      })();
      (function(d) {
        var s = d.createElement('script');s.async = true;s.src = 'https://static.userback.io/widget/v1.js';(d.head || d.body).appendChild(s);
      })(document);
            `}</Script>
          )}

          <AiToolkitButton
            setIsSidebarOpen={setIsSidebarOpen}
            isVisible={!hideAiChat && !!userId}
          />
          <AiChatSidebar
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              document.body.style.overflow = '';
            }}
            isVisible={!hideAiChat && !!userId}
          />

          {showInactivityModal && userId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-900">
                <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
                  Inactivity Detected
                </h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Redirecting to Google in <span className="font-bold">{countdown}</span> seconds...
                </p>
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
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
      </div>
    </>
  );
}

export default Providers;
