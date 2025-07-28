'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import AiChatSidebar from './components/AiChatSidebar';
import AiToolkitButton from './components/AiButton';
import RecaptchaGate from './components/RecaptchaGate';
import { useUser } from '@clerk/nextjs';
import { app, analytics, perf } from '@/firebase-init';
import CookieBanner from './components/CookieBanner';

declare global {
  interface Window {
    __translateReady?: boolean;
  }
}

function Providers({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const userId = user?.user?.id;
  const userData = user?.user;

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
  }, [userId]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const hideAiChat =
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/onboarding');

  const hideCookieBanner =
    pathname === '/rate-limit' ||
    pathname === '/block' ||
    pathname === '/updates' ||
    pathname === '/cookie-policy';

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
    height: 120,
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

      <Script
        id="google-translate-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
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
      {!hideCookieBanner && <CookieBanner />}
      <div>
        {userId ? (
          <RecaptchaGate>
            {children}

            {isClient && userData && (
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
                    Redirecting to Google in <span className="font-bold">{countdown}</span>{' '}
                    seconds...
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
      </div>
    </>
  );
}

export default Providers;
