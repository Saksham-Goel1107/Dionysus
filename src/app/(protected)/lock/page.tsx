'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { myAction } from '../Settings/actions';
import { useReverification } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

async function checkPasswordPwned(password: string): Promise<boolean> {
  const sha1 = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
  const hash = Array.from(new Uint8Array(sha1))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await res.text();
  return text.includes(suffix);
}
export default function LockPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPwned, setCheckingPwned] = useState(false);
  const [pwned, setPwned] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const performAction = useReverification(myAction);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/has-password')
      .then((res) => res.json())
      .then((data) => setHasPassword(!!data.hasPassword))
      .catch(() => setHasPassword(null));
  }, []);

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const myData = await performAction();
    if (!myData) return;
    handleSubmit(e);
  };

  const handlePasswordBlur = async () => {
    setPwned(false);
    setError('');
    if (password.length >= 8) {
      setCheckingPwned(true);
      try {
        const isPwned = await checkPasswordPwned(password);
        setPwned(isPwned);
        if (isPwned)
          setError(
            'This password has been found in data breaches. Please choose a more secure password.',
          );
      } catch {
        console.error('Error::checkPasswordPwned:', error);
      } finally {
        setCheckingPwned(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8 || password.length > 30) {
      setError('Password must be at least 8 and atmost 30 characters.');
      return;
    }
    if (pwned) {
      setError(
        'This password has been found in data breaches. Please choose a more secure password.',
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Password set successfully! You can now use your account. Redirecting...');
        setPassword('');
        setConfirmPassword('');
        try {
          fetch('/api/send-password-change-warning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
        } catch (err) {
          console.error('Error sending email', err);
        }
        setInterval(() => {
          router.replace('/dashboard');
        }, 1000);
      } else {
        setError(data.error || 'Failed to set password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get Clerk user email for autofill
  let clerkEmail = '';
  try {
    // @ts-ignore
    clerkEmail =
      window.Clerk?.user?.primaryEmailAddress?.emailAddress ||
      window.Clerk?.user?.emailAddresses?.[0]?.emailAddress ||
      '';
  } catch (error) {
    console.error('Error::getClerkEmail:', error);
  }

  return (
    <>
      {!hasPassword ? (
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
            onSubmit={(e) => handleClick(e)}
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
            <input
              type="text"
              name="username"
              value={clerkEmail}
              readOnly
              autoComplete="username"
              style={{ display: 'none' }}
              tabIndex={-1}
            />
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
              Set Your Account Password
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
              For your security, please set a password to lock your account.
              <br />
              You will need this password to access your account in the future.
            </p>
            <div style={{ width: '100%', position: 'relative', marginBottom: 14 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: pwned
                    ? '2px solid #f33'
                    : resolvedTheme === 'dark'
                      ? '1px solid #444'
                      : '1px solid #bcd',
                  background: resolvedTheme === 'dark' ? '#181818' : '#f8fafc',
                  color: resolvedTheme === 'dark' ? '#fff' : '#222',
                  fontSize: '1rem',
                  outline: 'none',
                  paddingRight: 38,
                }}
                name="password"
                autoComplete="new-password"
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
            {checkingPwned && (
              <div style={{ color: resolvedTheme === 'dark' ? '#aaa' : '#555', marginBottom: 8 }}>
                Checking password safety...
              </div>
            )}
            <div style={{ width: '100%', position: 'relative', marginBottom: 18 }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm Password"
                name="confirmNewPassword"
                autoComplete="new-password"
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
            {error && (
              <div style={{ color: '#f33', marginBottom: 12, fontWeight: 500 }}>{error}</div>
            )}
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
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: 8,
                background: loading
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
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
                boxShadow: resolvedTheme === 'dark' ? '0 2px 8px #3af4' : '0 2px 8px #3a8cff44',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </form>
        </div>
      ) : (
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
              textAlign: 'center',
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
                color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Password Already Set
            </h1>
            <p
              style={{
                color: resolvedTheme === 'dark' ? '#ccc' : '#333',
                fontSize: '1rem',
                opacity: 0.92,
                marginBottom: 20,
              }}
            >
              You already have a password set for your account.
              <br />
              Please use the{' '}
              <Link
                href="/unlock"
                style={{
                  color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
                  textDecoration: 'underline',
                  fontWeight: 500,
                }}
              >
                Unlock
              </Link>{' '}
              page to access your account.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
