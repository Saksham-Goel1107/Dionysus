'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// List of public route prefixes
const PUBLIC_ROUTE_PREFIXES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/docs',
  '/privacy',
  '/terms',
  '/about',
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

export default function RecaptchaGate({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const verifyToken = useCallback(async () => {
    // @ts-ignore
    if (!window.grecaptcha || !SITE_KEY) {
      return;
    }
    try {
      // @ts-ignore
      const token = await window.grecaptcha.execute(SITE_KEY, { action: 'verify' });
      const res = await fetch('/api/recaptcha-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.success) {
        setError('reCAPTCHA verification failed. Bot-like activity detected.');
        return;
      } else {
        setError('');
      }
    } catch (err) {
      return;
    }
  }, []);

  const handleVerification = useCallback(() => {
    verifyToken().catch((err) => {
      console.error('reCAPTCHA verification failed:', err);
      setError('reCAPTCHA verification failed. Please try again.');
    });
  }, [verifyToken]);

  useEffect(() => {
    if (!SITE_KEY) {
      setError('reCAPTCHA site key not set');
      return;
    }
    if (isPublicRoute(pathname)) {
      setError('');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.grecaptcha) {
        // @ts-ignore
        window.grecaptcha.ready(() => {
          handleVerification();
          intervalRef.current = setInterval(handleVerification, 60_000);
        });
      } else {
        setError('reCAPTCHA failed to load');
      }
    };
    script.onerror = () => {
      setError('Failed to load reCAPTCHA script.');
    };
    document.body.appendChild(script);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.body.removeChild(script);
    };
  }, [handleVerification, pathname]);

  return (
    <>
      {children}
      {error && !isPublicRoute(pathname) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at 60% 40%, #2d2d2d 0%, #111 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.7)',
            transition: 'background 0.4s',
          }}
        >
          <div
            style={{
              background: 'rgba(30,30,30,0.98)',
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              padding: '2.5rem 2rem 2rem 2rem',
              minWidth: 320,
              maxWidth: 420,
              border: '2px solid #f33',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{ fontSize: '3rem', marginBottom: 18, filter: 'drop-shadow(0 2px 8px #f33a)' }}
            >
              🛡️
            </span>
            <>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: 10, color: '#f33' }}>
                Access Blocked
              </h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.92, marginBottom: 0 }}>{error}</p>
              <div style={{ marginTop: 24, fontSize: '0.98rem', color: '#aaa' }}>
                This page is protected by reCAPTCHA.
                <br />
                If you believe this is a mistake, please refresh or contact{' '}
                <a className="font-semibold text-blue-500" href="mailto:sakshamgoel1107@gmail.com">
                  support
                </a>
                .
              </div>
            </>
          </div>
        </div>
      )}
    </>
  );
}
