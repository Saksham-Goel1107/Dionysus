'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { UserButton } from '@clerk/nextjs';
import { ModeToggle } from '@/app/components/ThemeToggle';
import Script from 'next/script';
import GradientTypewriter from './mvpblocks/gradient-typewriter';
import { Logo } from '@/app/components/logo';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, parameters: any) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [rememberMinutes, setRememberMinutes] = useState(15);
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // reCAPTCHA related states and refs
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaWidgetId = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/has-password')
      .then((res) => res.json())
      .then((data) => setHasPassword(!!data.hasPassword))
      .catch(() => setHasPassword(null));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('unlockToken');
    if (token) {
      fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockToken: token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUnlocked(true);
            setShowPrompt(false);
            setUnlockToken(token);
          } else {
            localStorage.removeItem('unlockToken');
            setUnlocked(false);
            setShowPrompt(true);
            setUnlockToken(null);
          }
        });
    } else {
      setUnlocked(false);
      setShowPrompt(true);
      setUnlockToken(null);
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('unlockToken');
        if (token) {
          fetch('/api/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unlockToken: token }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setUnlocked(true);
                setShowPrompt(false);
                setUnlockToken(token);
              } else {
                localStorage.removeItem('unlockToken');
                setUnlocked(false);
                setShowPrompt(true);
                setUnlockToken(null);
              }
            });
        } else {
          setUnlocked(false);
          setShowPrompt(true);
          setUnlockToken(null);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    function renderRecaptcha() {
      if (
        typeof window !== 'undefined' &&
        showPrompt &&
        window.grecaptcha &&
        containerRef.current &&
        !recaptchaWidgetId.current &&
        containerRef.current.childNodes.length === 0
      ) {
        recaptchaWidgetId.current = window.grecaptcha.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY_V2 || '',
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          size: 'normal',
          callback: (token: string) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(null),
          'error-callback': () => {
            setError('reCAPTCHA verification failed. Please try again.');
            setRecaptchaToken(null);
          },
        });
        setRecaptchaLoaded(true);
      }
    }
    if (typeof window !== 'undefined') {
      const checkReady = () => {
        if (
          window.grecaptcha &&
          typeof window.grecaptcha.render === 'function' &&
          containerRef.current &&
          containerRef.current.childNodes.length === 0 &&
          !recaptchaWidgetId.current
        ) {
          renderRecaptcha();
        } else {
          setTimeout(checkReady, 300);
        }
      };
      checkReady();
    }
  }, [showPrompt, resolvedTheme]);

  useEffect(() => {
    if (recaptchaLoaded && recaptchaWidgetId.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaWidgetId.current);
      setRecaptchaToken(null);
    }
  }, [resolvedTheme, recaptchaLoaded]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setVerifying(true);
    const password = passwordRef.current?.value || '';

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          rememberMinutes,
          recaptchaToken,
        }),
      });

      const data = await res.json();

      if (typeof data.limit === 'number' && typeof data.remaining === 'number') {
        setAttemptsLeft(data.remaining);
        if (typeof data.reset === 'number') setResetTime(data.reset);
      }

      if (res.status === 429) {
        setError(data.message || 'Too many attempts. Please try again later.');
      } else if (data.success && data.unlockToken) {
        localStorage.setItem('unlockToken', data.unlockToken);
        setUnlocked(true);
        setShowPrompt(false);
        setUnlockToken(data.unlockToken);
        setAttemptsLeft(null);
        setResetTime(null);
      } else {
        setError(data.error || 'Incorrect password.');

        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken(null);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Something went wrong.');
    } finally {
      setVerifying(false);
    }
  }

  function formatResetTime(reset: number | null) {
    if (!reset) return '';
    const ms = reset - Date.now();
    if (ms <= 0) return 'now';
    const min = Math.ceil(ms / 60000);
    return min === 1 ? 'in 1 minute' : `in ${min} minutes`;
  }

  if (hasPassword === null) return null;
  if (!hasPassword) return <>{children}</>;

  if (unlocked) return <>{children}</>;

  return showPrompt ? (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="afterInteractive"
        onLoad={() => setRecaptchaLoaded(true)}
      />

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            resolvedTheme === 'dark'
              ? 'radial-gradient(circle at 60% 40%, #2d2d2d 0%, #111 100%)'
              : 'radial-gradient(circle at 60% 40%, #f0f4ff 0%, #e2e8f0 100%)',
          transition: 'background 0.2s',
        }}
      >
        <form
          onSubmit={handleVerify}
          style={{
            background: resolvedTheme === 'dark' ? 'rgba(30,30,30,0.98)' : '#fff',
            borderRadius: 20,
            boxShadow:
              resolvedTheme === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.25)'
                : '0 8px 32px rgba(60,100,255,0.08)',
            padding: '2.5rem 2rem 2rem 2rem',
            minWidth: 320,
            maxWidth: 420,
            border: resolvedTheme === 'dark' ? '2px solid #3af' : '2px solid #3a8cff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
            <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
              gap: 16,
              padding: '0 4px',
            }}
            >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo />
              <span
              style={{
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 1,
                color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                marginLeft: 4,
              }}
              >
              <GradientTypewriter words="Dionysus" />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserButton />
              <ModeToggle />
            </div>
            </div>
          <span
            style={{
              fontSize: '2.5rem',
              marginBottom: 18,
              filter:
                resolvedTheme === 'dark'
                  ? 'drop-shadow(0 2px 8px #3af)'
                  : 'drop-shadow(0 2px 8px #3a8cff)',
            }}
          >
            🔒
          </span>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: 10,
              color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
            }}
          >
            Re-enter Password
          </h1>
          <p
            style={{
              fontSize: '1rem',
              opacity: 0.92,
              marginBottom: 20,
              color: resolvedTheme === 'dark' ? '#ccc' : '#333',
              textAlign: 'center',
            }}
          >
            For your security, please re-enter your password to unlock your account.
          </p>
          <div style={{ width: '100%', position: 'relative', marginBottom: 14 }}>
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              name="currentPassword"
              autoComplete="current-password"
              placeholder="Password"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: resolvedTheme === 'dark' ? '1px solid #444' : '1px solid #bcd',
                background: resolvedTheme === 'dark' ? '#181818' : '#f8fafc',
                color: resolvedTheme === 'dark' ? '#fff' : '#222',
                fontSize: '1rem',
                outline: 'none',
                paddingRight: 38,
              }}
              disabled={verifying}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: resolvedTheme === 'dark' ? '#aaa' : '#555',
                fontSize: 20,
                padding: 0,
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div style={{ width: '100%', marginBottom: 16 }}>
            <label
              htmlFor="remember-slider"
              style={{
                fontSize: 14,
                color: resolvedTheme === 'dark' ? '#aaa' : '#555',
                marginBottom: 4,
                display: 'block',
              }}
            >
              Remember me for: <b>{rememberMinutes} min</b>
            </label>
            <input
              id="remember-slider"
              type="range"
              min={5}
              max={60}
              step={5}
              value={rememberMinutes}
              onChange={(e) => setRememberMinutes(Number(e.target.value))}
              style={{ width: '100%' }}
              className="cursor-grab active:cursor-grabbing"
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: resolvedTheme === 'dark' ? '#888' : '#888',
              }}
            >
              <span>5 min</span>
              <span>1 hr</span>
            </div>
          </div>
          {typeof attemptsLeft === 'number' && (
            <div
              style={{
                color: attemptsLeft === 0 ? '#f33' : resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              Attempts left: {attemptsLeft} / 5
              {resetTime && attemptsLeft === 0 && (
                <span style={{ marginLeft: 8, color: '#f33' }}>
                  (Resets {formatResetTime(resetTime)})
                </span>
              )}
            </div>
          )}
          {error && <div style={{ color: '#f33', marginBottom: 12, fontWeight: 500 }}>{error}</div>}

          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 16 }}
          >
            <div ref={containerRef} style={{ minHeight: 78 }} />
            {!recaptchaLoaded && (
              <div style={{ color: '#f33', fontSize: 14, marginLeft: 8 }}>
                If you do not see the captcha, please disable ad blockers and reload.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={verifying || attemptsLeft === 0 || !recaptchaToken}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: 8,
              background:
                verifying || attemptsLeft === 0 || !recaptchaToken
                  ? resolvedTheme === 'dark'
                    ? '#444'
                    : '#bcd'
                  : resolvedTheme === 'dark'
                    ? 'linear-gradient(90deg,#3af,#3a8cff)'
                    : 'linear-gradient(90deg,#3a8cff,#3af)',
              color: resolvedTheme === 'dark' ? '#fff' : '#222',
              fontWeight: 700,
              fontSize: '1.1rem',
              border: 'none',
              cursor:
                verifying || attemptsLeft === 0 || !recaptchaToken ? 'not-allowed' : 'pointer',
              marginTop: 8,
              boxShadow: resolvedTheme === 'dark' ? '0 2px 8px #3af4' : '0 2px 8px #3a8cff44',
              transition: 'background 0.2s',
            }}
          >
            {verifying ? 'Verifying...' : 'Unlock'}
          </button>
          <div
            style={{
              marginTop: 18,
              color: resolvedTheme === 'dark' ? '#aaa' : '#555',
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            Forgot password? Contact{' '}
            <a
              href="mailto:sakshamgoel1107@gmail.com"
              style={{
                color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                textDecoration: 'underline',
              }}
            >
              support
            </a>
            .
          </div>
        </form>
      </div>
    </>
  ) : null;
}
