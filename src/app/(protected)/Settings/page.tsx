'use client';
import { Button } from '@/components/ui/button';
import { useReverification, useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import AccountSettings from './_components/AccountSettings';
import BillingSettings from './_components/BillingSettings';
import IntegrationSettings from './_components/IntegrationSettings';
import NotificationSettings from './_components/NotificationSettings';
import ProfileSettings from './_components/ProfileSettings';
import SecuritySettings from './_components/SecuritySettings';
import SettingsSidebar from './_components/SettingsSidebar';
import { myAction } from './actions';

const sectionComponents: Record<string, React.ReactNode> = {
  profile: <ProfileSettings />,
  account: <AccountSettings />,
  security: <SecuritySettings />,
  notifications: <NotificationSettings />,
  billing: <BillingSettings />,
  integrations: <IntegrationSettings />,
};

export default function SettingsPage() {
  const performAction = useReverification(myAction);
  const [current, setCurrent] = useState('profile');
  const [verified, setVerified] = useState(false);
  const [isAlphaBetaTester, setIsAlphaBetaTester] = useState(false);
  const [isLoadingAbStatus, setIsLoadingAbStatus] = useState(true);
  const { resolvedTheme } = useTheme();
  const { user } = useUser();

  // Check A/B testing status
  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      fetch('/api/ab-testing/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.abTestingOptIn) {
            setIsAlphaBetaTester(true);
          } else {
            setIsAlphaBetaTester(false);
          }
          setIsLoadingAbStatus(false);
        })
        .catch(() => {
          setIsAlphaBetaTester(false);
          setIsLoadingAbStatus(false);
        });
    } else {
      setIsAlphaBetaTester(false);
      setIsLoadingAbStatus(false);
    }
  }, [user]);

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const myData = await performAction();
      if (myData?.success) {
        setVerified(true);
      }
    } catch {
      console.log('User cancelled verification.');
    }
  };

  // Show loading while checking A/B status
  if (isLoadingAbStatus) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Show restricted access for non-A/B testers
  if (!isAlphaBetaTester) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center p-6 text-center">
          <div className="mb-8 rounded-xl border border-orange-400 bg-gradient-to-r from-orange-500 to-red-500 p-6 shadow-2xl">
            <div className="mb-4 text-4xl">🔒</div>
            <h2 className="mb-4 text-2xl font-bold text-white">Alpha/Beta Feature</h2>
            <p className="mb-4 text-lg text-white opacity-90">
              Advanced Settings are currently available only for our alpha and beta testers.
            </p>
            <div className="mb-4 rounded-lg bg-black/20 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">
                How to join Alpha/Beta Testing:
              </h3>
              <p className="mb-3 text-sm text-white opacity-75">
                Double-click your user button in the top-right corner of the header to access
                testing options.
              </p>
              <div className="flex justify-center">
                <div
                  className="relative cursor-not-allowed opacity-50"
                  title="Demo user button (disabled)"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                    <span className="text-xs font-bold text-white">👤</span>
                  </div>
                  <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                </div>
              </div>
              <p className="mt-2 text-xs text-white opacity-60">
                ↑ Find this button in your actual header
              </p>
            </div>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-600 opacity-50">
            <span className="text-2xl text-gray-400">⚙️</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] w-full flex-col md:flex-row">
      <div className="w-full md:w-auto">
        <SettingsSidebar current={current} onSelect={setCurrent} />
      </div>
      <main className="w-full flex-1 p-4 sm:p-6 md:p-8">
        {!verified ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div
              className={`mb-4 text-lg font-semibold text-${resolvedTheme === 'dark' ? 'gray-200' : 'gray-700'} text-center`}
            >
              Please verify your identity to access settings.
            </div>
            <Button onClick={handleClick}>Verify Now</Button>
          </div>
        ) : (
          sectionComponents[current]
        )}
      </main>
    </div>
  );
}
