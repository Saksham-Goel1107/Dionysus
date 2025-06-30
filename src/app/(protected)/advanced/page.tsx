'use client';
import { Protect } from '@clerk/nextjs';
import { Lock } from 'lucide-react';
import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import StressTester from './stress';
import CodeAnalytics from './CodeAnalytics';
import JWTSecretGenerator from './Jwt';
import Wiki from './wiki';
import LicenseMakerPage from './license';
import GitignoreModal from './GitignoreModal';
import MarkdownGenModal from './MarkdownGenModal';
import PlagiarismChecker from './PlagiarismChecker'

const Advanced = () => {
  const { resolvedTheme } = useTheme();
  const [showGitignore, setShowGitignore] = React.useState(false);
  const [showMarkdownGen, setShowMarkdownGen] = React.useState(false);
  return (
    <>
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
              Access to Advanced Tab is available exclusively for{' '}
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
        <div className="flex flex-col gap-4">
          <StressTester />
          <LicenseMakerPage />
          <JWTSecretGenerator />
          <CodeAnalytics />
          <Wiki />
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-900/60 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 blur-2xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 dark:bg-blue-900 rounded-full opacity-20 blur-2xl z-0" />
            <h2 className="text-2xl font-extrabold mb-3 text-blue-800 dark:text-blue-100 drop-shadow-lg z-10 tracking-tight">
              <span className="inline-block align-middle mr-2">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block text-blue-500 dark:text-blue-300">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16V4H4zm2 2h12v12H6V6zm3 3v6m3-6v6"/>
                </svg>
              </span>
              GitIgnore Generator
            </h2>
            <p className="mb-6 text-blue-700/80 dark:text-blue-200/80 text-center max-w-lg z-10 text-sm md:text-base">
              Instantly create the perfect <span className="font-semibold">.gitignore</span> file for your project. Select your tech stack and OS, then copy or download with one click!
            </p>
            <Button
              className="px-8 py-3 rounded-xl text-lg font-bold shadow-lg bg-gradient-to-r from-blue-500 via-primary to-blue-600 hover:from-blue-600 hover:to-primary/90 transition-all duration-200 border-0 z-10 flex items-center gap-2"
              onClick={() => setShowGitignore(true)}
              style={{ minWidth: 240 }}
            >
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="inline-block"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v16h16V4H4zm2 2h12v12H6V6zm3 3v6m3-6v6"
                />
              </svg>
              Generate .gitignore
            </Button>
          </div>
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-purple-900/60 dark:via-purple-950/80 dark:to-purple-900/60 rounded-2xl border border-purple-300 dark:border-purple-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 dark:bg-purple-800 rounded-full opacity-30 blur-2xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 dark:bg-purple-900 rounded-full opacity-20 blur-2xl z-0" />
            <h2 className="text-2xl font-extrabold mb-3 text-purple-800 dark:text-purple-100 drop-shadow-lg z-10 tracking-tight">
              <span className="inline-block align-middle mr-2">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block text-purple-500 dark:text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6m9 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </span>
              Markdown Docs Generator
            </h2>
            <p className="mb-6 text-purple-700/80 dark:text-purple-200/80 text-center max-w-lg z-10 text-sm md:text-base">
              Instantly create <span className="font-semibold">SECURITY.md</span>, <span className="font-semibold">CODE_OF_CONDUCT.md</span>, <span className="font-semibold">CONTRIBUTING.md</span> and more for your repo. Just enter your contact email and copy the result!
            </p>
            <Button
              className="px-8 py-3 rounded-xl text-lg font-bold shadow-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-200 border-0 z-10 flex items-center gap-2"
              onClick={() => setShowMarkdownGen(true)}
              style={{ minWidth: 240 }}
            >
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="inline-block"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-3-3v6m9 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Generate Markdown Docs
            </Button>
          </div>
          <GitignoreModal open={showGitignore} onClose={() => setShowGitignore(false)} />
          <MarkdownGenModal open={showMarkdownGen} onClose={() => setShowMarkdownGen(false)} />
        </div>
      <PlagiarismChecker/>
      </Protect>
    </>
  );
};

export default Advanced;
