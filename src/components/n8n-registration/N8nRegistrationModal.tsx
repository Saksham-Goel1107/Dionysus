'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/trpc/react';
import { Protect, useUser } from '@clerk/nextjs';
import bcrypt from 'bcryptjs';
import { useFeatureFlag } from 'configcat-react';
import { CheckCircle, Eye, EyeOff, Loader2, Lock, XCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';

interface N8nRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const N8nRegistrationModal = ({ isOpen, onClose }: N8nRegistrationModalProps) => {
  const { user, isLoaded } = useUser();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hibpWarning, setHibpWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { resolvedTheme } = useTheme();

  const { value: n8nRegistrationEnabled } = useFeatureFlag('n8nregistrationenabled', false);

  // Check if user has already registered with n8n
  const { data: n8nStatus, refetch: refetchN8nStatus } = api.user.getN8nStatus.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isLoaded) {
      setErrorMessage('User information not available');
      setStatus('error');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setStatus('error');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Check password against Have I Been Pwned (k-Anonymity) before hashing
      try {
        setHibpWarning('');
        const sha1 = await (async (pwd: string) => {
          const buf = new TextEncoder().encode(pwd);
          const hashBuffer = await crypto.subtle.digest('SHA-1', buf);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        })(password);

        const prefix = sha1.slice(0, 5);
        const suffix = sha1.slice(5);
        const hibpResp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (hibpResp.ok) {
          const text = await hibpResp.text();
          const found = text.split('\n').some((line) => {
            const parts = line.split(':');
            return parts[0] && parts[0].trim() === suffix;
          });
          if (found) {
            setHibpWarning(
              'This password appears in a public breach — please choose a different one.',
            );
            setIsLoading(false);
            setStatus('error');
            setErrorMessage('Password appears in a public breach. Choose a different password.');
            return;
          }
        }
      } catch (hibpErr) {
        console.error('HIBP check failed:', hibpErr);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        password: hashedPassword,
      };

      const response = await fetch('/api/proxy-n8n-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(
            'You have already registered with n8n. Multiple registrations are not allowed.',
          );
        } else {
          setErrorMessage(`Failed to register: ${response.status} ${response.statusText}`);
        }
        setStatus('error');
        return;
      }

      setStatus('success');

      // Refresh n8n status to update the UI
      await refetchN8nStatus();

      // Attempt to send detailed n8n access email (best-effort)
      try {
        await fetch('/api/send-n8n-registration-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress || 'n/a',
          }),
          credentials: 'include',
        });
      } catch (emailErr) {
        console.error('Failed to send n8n registration email:', emailErr);
      }

      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('N8n registration error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to register with n8n');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setConfirmPassword('');
      setStatus('idle');
      setErrorMessage('');
      onClose();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (!isLoading) {
        handleClose();
      }
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {!n8nRegistrationEnabled ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2
              className={`text-center text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              Registration Disabled
            </h2>
            <p
              className={`text-center ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'} max-w-md`}
            >
              n8n registration is currently turned off. Please try again later.
            </p>
          </div>
        ) : (
          <Protect
            plan="dionysus_advance_pack"
            fallback={
              <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                  <Lock className="h-8 w-8 text-yellow-600" />
                </div>
                <h2
                  className={`text-center text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                >
                  Advance Plan Required
                </h2>
                <p
                  className={`text-center ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-600'} max-w-md`}
                >
                  Access to access to N8n is only available exclusively for{' '}
                  <span className="font-semibold text-yellow-700">Dionysus Advance Pack</span>{' '}
                  subscribers.
                  <br />
                  Upgrade your plan to unlock this feature.
                </p>
                <Link href="/subscriptions">
                  <Button size="lg" className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            }
          >
            <DialogHeader>
              <DialogTitle>Register with n8n Instance</DialogTitle>
              <DialogDescription>
                Register your account with the self-hosted n8n instance. Your information will be
                used for registration.
              </DialogDescription>
            </DialogHeader>

            {/* Show message if user has already registered */}
            {n8nStatus?.isN8nDone && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You have already registered with n8n! You can access your n8n instance at{' '}
                  <a
                    href="https://n8n-ceaw.onrender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    https://n8n-ceaw.onrender.com
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Only show registration form if user hasn't registered yet */}
            {!n8nStatus?.isN8nDone && (
              <>
                {status === 'success' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully registered with n8n! This dialog will close automatically.
                    </AlertDescription>
                  </Alert>
                )}

                {status === 'error' && (
                  <Alert className="border-red-200 bg-red-50 text-red-800">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userInfo">User Information</Label>
                    <div className="rounded-md border bg-gray-50 p-3 dark:bg-gray-900">
                      <p className="text-sm">
                        <strong>Name:</strong> {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>

                  <div className="relative space-y-2">
                    <Label htmlFor="password">n8n Password</Label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password for n8n account"
                      required
                      minLength={8}
                      disabled={isLoading || status === 'success'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-9 inline-flex items-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    {hibpWarning && <p className="mt-1 text-sm text-red-600">{hibpWarning}</p>}
                  </div>

                  <div className="relative space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      disabled={isLoading || status === 'success'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-9 inline-flex items-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || status === 'success' || !password || !confirmPassword}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Registering...' : 'Register with n8n'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </Protect>
        )}
      </DialogContent>
    </Dialog>
  );
};
