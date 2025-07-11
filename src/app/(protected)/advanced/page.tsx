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
import PlagiarismChecker from './PlagiarismChecker';
import CommitGraphModal from '@/components/ui/CommitGraphModal';
import LogoGenerator from '@/components/logo-generator';
import MetaDataGenerator from './MetaDataGenerator';
import RobotSitemapGenerator from './RobotSitemapGenerator';
import MediaOptimizer from './MediaOptimizer';
import RegexTester from './RegexTester';
import YamlValidator from './YamlValidator';
import FileEncryptor from './FileEncryptor';
import { Client, Avatars } from 'appwrite';
import Image from 'next/image';

const appwriteUrl = process.env.NEXT_PUBLIC_APPWRITE_URL;
const appwriteId = process.env.NEXT_PUBLIC_APPWRITE_ID;

let avatars: Avatars | null = null;
if (appwriteUrl && appwriteId) {
  const client = new Client().setEndpoint(appwriteUrl).setProject(appwriteId);
  avatars = new Avatars(client);
}

const QRCodeGenerator: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setQrUrl(null);
    if (!input.trim()) {
      setError('Please enter some text.');
      return;
    }
    if (!avatars) {
      setError('QR code service is not configured.');
      return;
    }
    setLoading(true);
    try {
      const url = avatars.getQR(input.trim(), 400, 2, false).toString();
      setQrUrl(url);
    } catch (err) {
      setError('Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  if (!appwriteUrl || !appwriteId) {
    return (
      <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-red-50 dark:bg-red-900/60 rounded-2xl border border-red-300 dark:border-red-700 shadow-xl flex flex-col items-center">
        <h2 className="text-2xl font-extrabold mb-3 text-red-800 dark:text-red-100">
          QR Code Generator
        </h2>
        <div className="text-red-600 font-semibold">
          QR code service is not configured. Please set APPWRITE_URL and APPWRITE_ID in your
          environment.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-green-900/60 dark:via-green-950/80 dark:to-green-900/60 rounded-2xl border border-green-300 dark:border-green-700 shadow-xl flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-200 dark:bg-green-800 rounded-full opacity-30 blur-2xl z-0" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-100 dark:bg-green-900 rounded-full opacity-20 blur-2xl z-0" />
      <h2 className="text-2xl font-extrabold mb-3 text-green-800 dark:text-green-100 drop-shadow-lg z-10 tracking-tight">
        <span className="inline-block align-middle mr-2">🔳</span>
        QR Code Generator
      </h2>
      <p className="mb-6 text-green-700/80 dark:text-green-200/80 text-center max-w-lg z-10 text-sm md:text-base">
        Enter any text, URL, or data and instantly get a QR code you can scan or download!
      </p>
      <form onSubmit={handleGenerate} className="flex flex-col items-center gap-4 w-full z-10">
        <input
          className="w-full max-w-md px-4 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-green-950 text-lg text-green-900 dark:text-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          type="text"
          placeholder="Enter text or URL..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="px-8 py-2 rounded-xl text-lg font-bold shadow-lg bg-gradient-to-r from-green-500 via-green-400 to-green-600 hover:from-green-600 hover:to-green-500/90 transition-all duration-200 border-0 z-10 flex items-center gap-2 text-white"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>
      {error && <div className="text-red-600 mt-2 font-semibold">{error}</div>}
      {qrUrl && (
        <div className="mt-6 flex flex-col items-center">
          <Image
            src={qrUrl}
            alt="QR Code"
            width={192}
            height={192}
            className="w-48 h-48 rounded-lg border border-green-400 shadow-lg bg-white"
          />
          <a
            href={qrUrl}
            download="qrcode.png"
            className="mt-3 text-green-700 dark:text-green-200 underline text-sm"
          >
            Download QR Code
          </a>
        </div>
      )}
    </div>
  );
};

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

          {/* Media Optimizer Component */}
          <MediaOptimizer />

          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-900/60 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 blur-2xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 dark:bg-blue-900 rounded-full opacity-20 blur-2xl z-0" />
            <h2 className="text-2xl font-extrabold mb-3 text-blue-800 dark:text-blue-100 drop-shadow-lg z-10 tracking-tight">
              <span className="inline-block align-middle mr-2">
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="inline-block text-blue-500 dark:text-blue-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v16h16V4H4zm2 2h12v12H6V6zm3 3v6m3-6v6"
                  />
                </svg>
              </span>
              GitIgnore Generator
            </h2>
            <p className="mb-6 text-blue-700/80 dark:text-blue-200/80 text-center max-w-lg z-10 text-sm md:text-base">
              Instantly create the perfect <span className="font-semibold">.gitignore</span> file
              for your project. Select your tech stack and OS, then copy or download with one click!
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
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="inline-block text-purple-500 dark:text-purple-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-3-3v6m9 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              Markdown Docs Generator
            </h2>
            <p className="mb-6 text-purple-700/80 dark:text-purple-200/80 text-center max-w-lg z-10 text-sm md:text-base">
              Instantly create <span className="font-semibold">SECURITY.md</span>,{' '}
              <span className="font-semibold">CODE_OF_CONDUCT.md</span>,{' '}
              <span className="font-semibold">CONTRIBUTING.md</span> and more for your repo. Just
              enter your contact email and copy the result!
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

          {/* Logo Generator Card */}
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-amber-900/60 dark:via-amber-950/80 dark:to-amber-900/60 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200 dark:bg-amber-800 rounded-full opacity-30 blur-2xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-100 dark:bg-amber-900 rounded-full opacity-20 blur-2xl z-0" />
            <h2 className="text-2xl font-extrabold mb-3 text-amber-800 dark:text-amber-100 drop-shadow-lg z-10 tracking-tight">
              <span className="inline-block align-middle mr-2">
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="inline-block text-amber-500 dark:text-amber-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              Logo Generator
            </h2>
            <p className="mb-6 text-amber-700/80 dark:text-amber-200/80 text-center max-w-lg z-10 text-sm md:text-base">
              Create stunning logos for your projects with AI. Customize style, colors, and get
              professional results in seconds!
            </p>
            <LogoGenerator
              buttonVariant="default"
              buttonText="Generate Logo"
              buttonSize="lg"
              className="px-8 py-3 rounded-xl text-lg font-bold shadow-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-500/90 transition-all duration-200 border-0 z-10"
            />
          </div>

          <MetaDataGenerator />
          <RobotSitemapGenerator />
          <QRCodeGenerator />
          {/* Advanced Utilities */}
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-violet-50 via-white to-violet-100 dark:from-violet-900/60 dark:via-violet-950/80 dark:to-violet-900/60 rounded-2xl border border-violet-300 dark:border-violet-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <RegexTester />
          </div>
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-lime-50 via-white to-lime-100 dark:from-lime-900/60 dark:via-lime-950/80 dark:to-lime-900/60 rounded-2xl border border-lime-300 dark:border-lime-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <YamlValidator />
          </div>
          <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900/60 dark:via-gray-950/80 dark:to-gray-900/60 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <FileEncryptor />
          </div>
        </div>
        <PlagiarismChecker />
        <CommitGraphModal />
      </Protect>
    </>
  );
};

export default Advanced;
