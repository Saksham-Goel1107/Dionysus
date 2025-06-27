"use client"
import React, { useState } from 'react';
import SettingsSidebar from './_components/SettingsSidebar';
import ProfileSettings from './_components/ProfileSettings';
import AccountSettings from './_components/AccountSettings';
import SecuritySettings from './_components/SecuritySettings';
import NotificationSettings from './_components/NotificationSettings';
import BillingSettings from './_components/BillingSettings';
import IntegrationSettings from './_components/IntegrationSettings';
import { myAction } from './actions'
import { useReverification } from '@clerk/nextjs';

const sectionComponents: Record<string, React.ReactNode> = {
  profile: <ProfileSettings />,
  account: <AccountSettings />,
  security: <SecuritySettings />,
  notifications: <NotificationSettings />,
  billing: <BillingSettings />,
  integrations: <IntegrationSettings />,
};

export default function SettingsPage() {
  const performAction = useReverification(myAction)
  const [current, setCurrent] = useState('profile');
  const [verified,setVerified] = useState(false)

  const handleClick = async () => {
    const myData = await performAction()
    if (!myData) return
	setVerified(true)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[70vh] w-full">
      <div className="w-full md:w-auto">
        <SettingsSidebar current={current} onSelect={setCurrent} />
      </div>
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        {!verified ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="mb-4 text-lg font-semibold text-gray-700">
              Please verify your identity to access settings.
            </div>
            <button
              onClick={handleClick}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Verify Now
            </button>
          </div>
        ) : (
          sectionComponents[current]
        )}
      </main>
    </div>
  );
}