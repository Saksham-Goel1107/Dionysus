'use client';
import React, { useState } from 'react';
import SettingsSidebar from './_components/SettingsSidebar';
import ProfileSettings from './_components/ProfileSettings';
import AccountSettings from './_components/AccountSettings';
import SecuritySettings from './_components/SecuritySettings';
import NotificationSettings from './_components/NotificationSettings';
import BillingSettings from './_components/BillingSettings';
import IntegrationSettings from './_components/IntegrationSettings';
import { myAction } from './actions';
import { useReverification } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

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
  const { resolvedTheme } = useTheme();

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
