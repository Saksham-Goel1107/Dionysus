'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReverification, useUser } from '@clerk/nextjs';
import { Shield, Settings, Lock, Sparkles, Users } from 'lucide-react';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900">
        <Card className="mx-4 w-full max-w-md border-0 bg-white/80 shadow-2xl backdrop-blur-lg dark:bg-gray-800/80">
          <CardContent className="flex flex-col items-center space-y-6 p-8">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-transparent border-t-blue-400"></div>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Initializing Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Checking your access permissions...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show restricted access for non-A/B testers
  if (!isAlphaBetaTester) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-400 opacity-20 mix-blend-multiply blur-2xl filter"></div>
          <div className="animation-delay-2000 absolute right-1/4 top-3/4 h-96 w-96 animate-pulse rounded-full bg-purple-400 opacity-20 mix-blend-multiply blur-2xl filter"></div>
        </div>

        <Card className="relative mx-auto w-full max-w-2xl border-0 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-gray-800/90">
          <CardContent className="p-8">
            {/* Header Section */}
            {/* Header Section */}
            <div className="mb-8 text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
                <Settings className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
                Advanced Settings
              </h1>
              <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                Unlock powerful configuration options and premium features
              </p>
            </div>

            {/* Status Badge */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 backdrop-blur-sm">
                <Lock className="h-4 w-4 text-orange-400" />
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  Alpha/Beta Exclusive
                </span>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:border-blue-800/50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <div className="mb-2 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                    Enhanced Security
                  </h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Advanced authentication and privacy controls
                </p>
              </div>

              <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-100 p-4 dark:border-purple-800/50 dark:from-purple-950/50 dark:to-pink-950/50">
                <div className="mb-2 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                    Premium Features
                  </h3>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Exclusive tools and customization options
                </p>
              </div>
            </div>

            {/* Join Instructions */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-slate-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-slate-800">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Join the Alpha Testing Program
                </h3>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    1
                  </div>
                  <p className="text-sm">
                    Locate your profile button in the top-right corner of the navigation
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    2
                  </div>
                  <p className="text-sm">
                    Double-click the profile button to access testing enrollment
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    3
                  </div>
                  <p className="text-sm">
                    Enable alpha testing and return to unlock advanced settings
                  </p>
                </div>
              </div>

              {/* Demo Button */}
              <div className="mt-6 flex flex-col items-center">
                <div className="group relative cursor-pointer">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur transition duration-300 group-hover:opacity-50"></div>
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg dark:border-blue-700">
                    <span className="text-lg">👤</span>
                    <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                      <div className="h-full w-full animate-ping rounded-full bg-white/30"></div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 animate-pulse text-xs text-gray-500 dark:text-gray-400">
                  Look for this in your header ↑
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-4 text-center dark:from-gray-800 dark:to-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🚀 <strong>Be part of the future</strong> - Help us shape the next generation of
                settings and features
              </p>
            </div>
          </CardContent>
        </Card>

        <style jsx>{`
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <div className="flex-shrink-0 lg:w-80">
            <SettingsSidebar current={current} onSelect={setCurrent} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {!verified ? (
              <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-lg dark:bg-gray-800/80">
                <CardHeader className="pb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Security Verification Required
                  </CardTitle>
                  <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Please verify your identity to access your settings securely
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8 text-center">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                        <Shield className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Secure Access
                        </p>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                        <Lock className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">
                          Protected Data
                        </p>
                      </div>
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
                        <Sparkles className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Enhanced Features
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                        To protect your account and ensure secure access to sensitive settings, we
                        need to verify your identity before proceeding.
                      </p>
                      <Button
                        onClick={handleClick}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Verify Identity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center lg:text-left">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100 lg:text-4xl">
                    Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage your account preferences and security settings
                  </p>
                </div>

                {/* Content Card */}
                <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-lg dark:bg-gray-800/80">
                  <CardContent className="p-8">{sectionComponents[current]}</CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
