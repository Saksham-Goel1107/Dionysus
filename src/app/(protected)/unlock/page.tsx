'use client';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReverification } from '@clerk/nextjs';
import { myAction } from '../Settings/actions';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
const PasswordStrengthMeter = dynamic(() => import('@/components/PasswordStrengthMeter'), { ssr: false });
import { passwordCriteriaMet } from '@/components/PasswordStrengthMeter';

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

export default function UnlockPage() {
  const { user } = useUser();
  const userId = user?.id;
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<'update' | 'disable' | null>(null);
  const performAction = useReverification(myAction);
  const [verified, setVerified] = useState<boolean>(false);

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
    function renderRecaptcha() {
      if (
        typeof window !== 'undefined' &&
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
  }, [confirmAction, resolvedTheme]);

  useEffect(() => {
    if (recaptchaLoaded && recaptchaWidgetId.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaWidgetId.current);
      setRecaptchaToken(null);
    }
  }, [resolvedTheme, recaptchaLoaded]);

  function formatResetTime(reset: number | null) {
    if (!reset) return '';
    const ms = reset - Date.now();
    if (ms <= 0) return 'now';
    const min = Math.ceil(ms / 60000);
    return min === 1 ? 'in 1 minute' : `in ${min} minutes`;
  }

  function isInputValid(action: 'update' | 'disable') {
    if (!currentPassword || currentPassword.trim() === '') {
      setError('Current password is required.');
      setConfirmAction(null);
      return false;
    }
    if (action === 'update') {
      if (!newPassword || newPassword.trim() === '') {
        setError('New password is required.');
        setConfirmAction(null);
        return false;
      }
      if (!confirmPassword || confirmPassword.trim() === '') {
        setError('Please confirm your new password.');
        setConfirmAction(null);
        return false;
      }
      if (newPassword === currentPassword) {
        setError('New password cannot be the same as the current password.');
        setConfirmAction(null);
        return false;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        setConfirmAction(null);
        return false;
      }
      if (!passwordCriteriaMet(newPassword)) {
        setError('Password does not meet all requirements.');
        setConfirmAction(null);
        return false;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters.');
        setConfirmAction(null);
        return false;
      }
    }
    return true;
  }

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const myData = await performAction();
    if (!myData) return;
    setVerified(true);
  };

  const handleUpdate = async () => {
    if (!isInputValid('update')) return;

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (typeof data.limit === 'number' && typeof data.remaining === 'number') {
        setAttemptsLeft(data.remaining);
        if (typeof data.reset === 'number') setResetTime(data.reset);
      }

      if (data.requireRecaptcha) {
        setError('Security verification required. Please complete the captcha.');
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken(null);
        }
        return;
      }

      if (data.success) {
        setSuccess('Password updated successfully! Redirecting...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setConfirmAction(null);
        localStorage.removeItem('unlockToken');
        fetch('/api/send-password-change-warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'change' }),
        });
        setTimeout(() => router.replace('/dashboard'), 1000);
      } else {
        setError(data.error || 'Failed to update password.');
        setConfirmAction(null);

        // Reset reCAPTCHA on error
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken(null);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirmAction(null);

      // Reset reCAPTCHA on error
      if (window.grecaptcha && recaptchaWidgetId.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setRecaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!isInputValid('disable')) return;

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          disable: true,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      if (typeof data.limit === 'number' && typeof data.remaining === 'number') {
        setAttemptsLeft(data.remaining);
        if (typeof data.reset === 'number') setResetTime(data.reset);
      }

      if (data.requireRecaptcha) {
        setError('Security verification required. Please complete the captcha.');
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken(null);
        }
        return;
      }

      if (data.success) {
        setSuccess('Password lock disabled. Redirecting...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setConfirmAction(null);
        localStorage.removeItem('unlockToken');
        try {
          fetch('/api/send-password-change-warning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'delete' }),
          });
        } catch (err) {
          console.error('Error sending email', err);
        }
        setTimeout(() => router.replace('/dashboard'), 1000);
      } else {
        setError(data.error || 'Failed to disable password lock.');
        setConfirmAction(null);

        // Reset reCAPTCHA on error
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken(null);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirmAction(null);

      // Reset reCAPTCHA on error
      if (window.grecaptcha && recaptchaWidgetId.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setRecaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (hasPassword === false) {
    return (
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
        }}
      >
        <div
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
              color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            No password set
          </h1>
          <p
            style={{
              fontSize: '1rem',
              opacity: 0.92,
              color: resolvedTheme === 'dark' ? '#ccc' : '#333',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Please set a password to protect your account.
          </p>
          <Button
            onClick={() => router.replace('/lock')}
            style={{ width: '100%', fontWeight: 600 }}
          >
            Set Password
          </Button>
        </div>
      </div>
    );
  }

  return (
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
      }}
    >
      <form
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
          🔓
        </span>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: 10,
            color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
          }}
        >
          Update or Disable Password
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
          Enter your current password to update or disable password lock.
        </p>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div ref={containerRef} style={{ minHeight: 78 }} />
          {!recaptchaLoaded && (
            <div style={{ color: '#f33', fontSize: 14, marginLeft: 8 }}>
              If you do not see the captcha, please disable ad blockers and reload.
            </div>
          )}
        </div>
        <div style={{ width: '100%', position: 'relative', marginBottom: 14 }}>
          <input
            type={showCurrent ? 'text' : 'password'}
            placeholder="Current Password"
            name="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError('');
            }}
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
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showCurrent ? 'Hide password' : 'Show password'}
            onClick={() => setShowCurrent((v) => !v)}
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
            {showCurrent ? '🙈' : '👁️'}
          </button>
        </div>
        <div style={{ width: '100%', position: 'relative', marginBottom: 14 }}>
          <input
            type={showNew ? 'text' : 'password'}
            name="newPassword"
            autoComplete="new-password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showNew ? 'Hide password' : 'Show password'}
            onClick={() => setShowNew((v) => !v)}
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
            {showNew ? '🙈' : '👁️'}
          </button>
        </div>
        <div style={{ width: '100%', position: 'relative', marginBottom: 14 }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            name="confirmNewPassword"
            autoComplete="new-password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirm((v) => !v)}
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
            {showConfirm ? '🙈' : '👁️'}
          </button>
        </div>
        {/* Password strength meter and criteria after both fields */}
        <div style={{ width: '100%', marginBottom: 8 }}>
          <PasswordStrengthMeter password={newPassword} />
        </div>
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
          onLoad={() => setRecaptchaLoaded(true)}
        />
        {typeof attemptsLeft === 'number' && (
          <div
            style={{
              color: attemptsLeft === 0 ? '#f33' : resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Attempts left: {attemptsLeft} / 5
            {resetTime && (
              <span style={{ marginLeft: 8, color: attemptsLeft === 0 ? '#f33' : undefined }}>
                (Resets {formatResetTime(resetTime)})
              </span>
            )}
          </div>
        )}
        {error && <div style={{ color: '#f33', marginBottom: 12, fontWeight: 500 }}>{error}</div>}
        {success && (
          <div
            style={{
              color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {success}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
          <Button
            type="button"
            variant="default"
            className="flex-1"
            disabled={loading || attemptsLeft === 0}
            onClick={() => setConfirmAction('update')}
          >
            {loading && confirmAction === 'update' ? (
              <span className="loader" style={{ marginRight: 8 }} />
            ) : null}
            Update Password
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => setConfirmAction('disable')}
            disabled={loading || attemptsLeft === 0}
          >
            {loading && confirmAction === 'disable' ? (
              <span className="loader" style={{ marginRight: 8 }} />
            ) : null}
            Disable Password
          </Button>
        </div>
        <div className="text-xs text-center mt-3">
          If you forgot your password contact{' '}
          <Link
            className="text-blue-500 font-bold"
            href={`${userId ? '/supportAuth' : '/support'}`}
          >
            Support
          </Link>
        </div>
        {/* Confirmation Dialog */}
        <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmAction === 'update' ? 'Confirm Update' : 'Confirm Disable'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ margin: '1rem 0' }}>
              {confirmAction === 'update'
                ? 'Are you sure you want to update your password?'
                : 'Are you sure you want to disable password lock? This will remove your password protection.'}
            </div>
            {typeof attemptsLeft === 'number' && (
              <div
                style={{
                  color:
                    attemptsLeft === 0 ? '#f33' : resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                Attempts left: {attemptsLeft} / 5
                {resetTime && (
                  <span style={{ marginLeft: 8, color: attemptsLeft === 0 ? '#f33' : undefined }}>
                    (Resets {formatResetTime(resetTime)})
                  </span>
                )}
              </div>
            )}
            {error && (
              <div style={{ color: '#f33', marginBottom: 12, fontWeight: 500 }}>{error}</div>
            )}
            <DialogFooter>
              <Button onClick={() => setConfirmAction(null)} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  if (!recaptchaToken) {
                    setError('Please complete the reCAPTCHA verification');
                    return;
                  }
                  if (confirmAction === 'update') {
                    verified ? handleUpdate() : handleClick(e);
                  } else {
                    verified ? handleDisable() : handleClick(e);
                  }
                }}
                variant={confirmAction === 'update' ? 'default' : 'destructive'}
                disabled={loading || !recaptchaToken}
              >
                {loading ? <span className="loader" style={{ marginRight: 8 }} /> : null}
                {confirmAction === 'update' ? 'Update' : 'Disable'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <style>{`
          .loader {
            display: inline-block;
            width: 1em;
            height: 1em;
            border: 2px solid #3af;
            border-radius: 50%;
            border-top: 2px solid transparent;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </form>
    </div>
  );
}
