'use client';
import { Protect } from '@clerk/nextjs';
import { Lock } from 'lucide-react';
import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
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
import CodeFormatter from './CodeFormatter';
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
    } catch {
      setError('Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  if (!appwriteUrl || !appwriteId) {
    return (
      <div className="mx-auto my-6 flex w-full max-w-2xl flex-col items-center rounded-2xl border border-red-300 bg-red-50 p-8 shadow-xl dark:border-red-700 dark:bg-red-900/60">
        <h2 className="mb-3 text-2xl font-extrabold text-red-800 dark:text-red-100">
          QR Code Generator
        </h2>
        <div className="font-semibold text-red-600">
          QR code service is not configured. Please set APPWRITE_URL and APPWRITE_ID in your
          environment.
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-green-300 bg-gradient-to-br from-green-50 via-white to-green-100 p-8 shadow-xl dark:border-green-700 dark:from-green-900/60 dark:via-green-950/80 dark:to-green-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-green-200 opacity-30 blur-2xl dark:bg-green-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-green-100 opacity-20 blur-2xl dark:bg-green-900" />
      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-green-800 drop-shadow-lg dark:text-green-100">
        <span className="mr-2 inline-block align-middle">🔳</span>
        QR Code Generator
      </h2>
      <p className="z-10 mb-6 max-w-lg text-center text-sm text-green-700/80 dark:text-green-200/80 md:text-base">
        Enter any text, URL, or data and instantly get a QR code you can scan or download!
      </p>
      <form onSubmit={handleGenerate} className="z-10 flex w-full flex-col items-center gap-4">
        <input
          className="w-full max-w-md rounded-lg border border-green-300 bg-white px-4 py-2 text-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-green-700 dark:bg-green-950 dark:text-green-100"
          type="text"
          placeholder="Enter text or URL..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="z-10 flex items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-green-500 via-green-400 to-green-600 px-8 py-2 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-green-500/90"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>
      {error && <div className="mt-2 font-semibold text-red-600">{error}</div>}
      {qrUrl && (
        <div className="mt-6 flex flex-col items-center">
          <Image
            src={qrUrl}
            alt="QR Code"
            width={192}
            height={192}
            className="h-48 w-48 rounded-lg border border-green-400 bg-white shadow-lg"
          />
          <a
            href={qrUrl}
            download="qrcode.png"
            className="mt-3 text-sm text-green-700 underline dark:text-green-200"
          >
            Download QR Code
          </a>
        </div>
      )}
    </div>
  );
};

const featureIndex = [
  { id: 'stress-tester', label: 'Stress Tester', icon: '💪' },
  { id: 'license-maker', label: 'License Maker', icon: '📄' },
  { id: 'jwt-secret', label: 'JWT Secret Generator', icon: '🔑' },
  { id: 'code-analytics', label: 'Code Analytics', icon: '📊' },
  { id: 'wiki', label: 'Wiki', icon: '📚' },
  { id: 'media-optimizer', label: 'Media Optimizer', icon: '🖼️' },
  { id: 'gitignore', label: 'GitIgnore Generator', icon: '🚫' },
  { id: 'markdown-gen', label: 'Markdown Docs Generator', icon: '📝' },
  { id: 'logo-gen', label: 'Logo Generator', icon: '🎨' },
  { id: 'meta-gen', label: 'MetaData Generator', icon: '🔖' },
  { id: 'robot-sitemap', label: 'Robot Sitemap Generator', icon: '🤖' },
  { id: 'qr-code', label: 'QR Code Generator', icon: '🔳' },
  { id: 'code-formatter', label: 'Code Beautifier', icon: '✨' },
  { id: 'regex-tester', label: 'Regex Tester', icon: '🔍' },
  { id: 'yaml-validator', label: 'YAML Validator', icon: '🧩' },
  { id: 'file-encryptor', label: 'File Encryptor', icon: '🔒' },
  { id: 'plagiarism-checker', label: 'Plagiarism Checker', icon: '🕵️' },
  { id: 'commit-graph', label: 'Commit Graph Modal', icon: '🌳' },
];

const Advanced = () => {
  const { resolvedTheme } = useTheme();
  const [showGitignore, setShowGitignore] = React.useState(false);
  const [showMarkdownGen, setShowMarkdownGen] = React.useState(false);
  const [showIndex, setShowIndex] = React.useState(true);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.style.scrollBehavior = '';
      }
    };
  }, []);
  return (
    <>
      <div className="sticky top-2 z-40 mx-auto mb-4 w-full max-w-2xl">
        <div className="flex flex-col items-center rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 via-white to-blue-100 p-2 shadow-xl backdrop-blur-md dark:border-blue-700 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-900/60 sm:p-3">
          <button
            className="mb-2 text-base font-semibold text-blue-700 hover:underline focus:outline-none dark:text-blue-200"
            onClick={() => setShowIndex((v) => !v)}
            aria-label="Toggle feature index"
          >
            {showIndex ? 'Hide' : 'Show'} Feature Index
          </button>
          {showIndex && (
            <div className="grid w-full grid-cols-2 gap-2 px-1 sm:grid-cols-3 md:grid-cols-4">
              {featureIndex.map((f) => (
                <a
                  href={`#${f.id}`}
                  key={f.id}
                  onClick={() => setShowIndex(false)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-900 shadow-sm transition-all duration-150 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-700/60 dark:text-blue-100 dark:hover:bg-blue-600"
                  style={{ minWidth: 0 }}
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="truncate">{f.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
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
        <div className="flex flex-col gap-6">
          {featureIndex.map((f) => {
            let content = null;
            switch (f.id) {
              case 'stress-tester':
                content = <StressTester />;
                break;
              case 'license-maker':
                content = <LicenseMakerPage />;
                break;
              case 'jwt-secret':
                content = <JWTSecretGenerator />;
                break;
              case 'code-analytics':
                content = <CodeAnalytics />;
                break;
              case 'wiki':
                content = <Wiki />;
                break;
              case 'media-optimizer':
                content = <MediaOptimizer />;
                break;
              case 'gitignore':
                content = (
                  <div>
                    <p className="z-10 mb-6 max-w-lg text-center text-sm text-blue-700/80 dark:text-blue-200/80 md:text-base">
                      Instantly create the perfect <span className="font-semibold">.gitignore</span>{' '}
                      file for your project. Select your tech stack and OS, then copy or download
                      with one click!
                    </p>
                    <Button
                      className="z-10 flex items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-blue-500 via-primary to-blue-600 px-8 py-3 text-lg font-bold shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-primary/90"
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
                );
                break;
              case 'markdown-gen':
                content = (
                  <div>
                    <p className="z-10 mb-6 max-w-lg text-center text-sm text-purple-700/80 dark:text-purple-200/80 md:text-base">
                      Instantly create <span className="font-semibold">SECURITY.md</span>,{' '}
                      <span className="font-semibold">CODE_OF_CONDUCT.md</span>,{' '}
                      <span className="font-semibold">CONTRIBUTING.md</span> and more for your repo.
                      Just enter your contact email and copy the result!
                    </p>
                    <Button
                      className="z-10 flex items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 px-8 py-3 text-lg font-bold shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-fuchsia-600"
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
                );
                break;
              case 'logo-gen':
                content = (
                  <LogoGenerator
                    buttonVariant="default"
                    buttonText="Generate Logo"
                    buttonSize="lg"
                    className="z-10 rounded-xl border-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-8 py-3 text-lg font-bold shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-yellow-500/90"
                  />
                );
                break;
              case 'meta-gen':
                content = <MetaDataGenerator />;
                break;
              case 'robot-sitemap':
                content = <RobotSitemapGenerator />;
                break;
              case 'qr-code':
                content = <QRCodeGenerator />;
                break;
              case 'code-formatter':
                content = <CodeFormatter />;
                break;
              case 'regex-tester':
                content = <RegexTester />;
                break;
              case 'yaml-validator':
                content = <YamlValidator />;
                break;
              case 'file-encryptor':
                content = <FileEncryptor />;
                break;
              case 'plagiarism-checker':
                content = <PlagiarismChecker />;
                break;
              case 'commit-graph':
                content = <CommitGraphModal />;
                break;
              default:
                content = null;
            }
            const colorMap: Record<string, string> = {
              'stress-tester':
                'from-pink-50 via-white to-pink-100 dark:from-pink-900/60 dark:via-pink-950/80 dark:to-pink-900/60 border-pink-300 dark:border-pink-700',
              'license-maker':
                'from-gray-50 via-white to-gray-100 dark:from-gray-900/60 dark:via-gray-950/80 dark:to-gray-900/60 border-gray-300 dark:border-gray-700',
              'jwt-secret':
                'from-yellow-50 via-white to-yellow-100 dark:from-yellow-900/60 dark:via-yellow-950/80 dark:to-yellow-900/60 border-yellow-300 dark:border-yellow-700',
              'code-analytics':
                'from-green-50 via-white to-green-100 dark:from-green-900/60 dark:via-green-950/80 dark:to-green-900/60 border-green-300 dark:border-green-700',
              wiki: 'from-indigo-50 via-white to-indigo-100 dark:from-indigo-900/60 dark:via-indigo-950/80 dark:to-indigo-900/60 border-indigo-300 dark:border-indigo-700',
              'media-optimizer':
                'from-cyan-50 via-white to-cyan-100 dark:from-cyan-900/60 dark:via-cyan-950/80 dark:to-cyan-900/60 border-cyan-300 dark:border-cyan-700',
              gitignore:
                'from-blue-50 via-white to-blue-100 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-900/60 border-blue-300 dark:border-blue-700',
              'markdown-gen':
                'from-purple-50 via-white to-purple-100 dark:from-purple-900/60 dark:via-purple-950/80 dark:to-purple-900/60 border-purple-300 dark:border-purple-700',
              'logo-gen':
                'from-amber-50 via-white to-amber-100 dark:from-amber-900/60 dark:via-amber-950/80 dark:to-amber-900/60 border-amber-300 dark:border-amber-700',
              'meta-gen':
                'from-rose-50 via-white to-rose-100 dark:from-rose-900/60 dark:via-rose-950/80 dark:to-rose-900/60 border-rose-300 dark:border-rose-700',
              'robot-sitemap':
                'from-lime-50 via-white to-lime-100 dark:from-lime-900/60 dark:via-lime-950/80 dark:to-lime-900/60 border-lime-300 dark:border-lime-700',
              'qr-code':
                'from-green-50 via-white to-green-100 dark:from-green-900/60 dark:via-green-950/80 dark:to-green-900/60 border-green-300 dark:border-green-700',
              'code-formatter':
                'from-fuchsia-50 via-white to-fuchsia-100 dark:from-fuchsia-900/60 dark:via-fuchsia-950/80 dark:to-fuchsia-900/60 border-fuchsia-300 dark:border-fuchsia-700',
              'regex-tester':
                'from-violet-50 via-white to-violet-100 dark:from-violet-900/60 dark:via-violet-950/80 dark:to-violet-900/60 border-violet-300 dark:border-violet-700',
              'yaml-validator':
                'from-lime-50 via-white to-lime-100 dark:from-lime-900/60 dark:via-lime-950/80 dark:to-lime-900/60 border-lime-300 dark:border-lime-700',
              'file-encryptor':
                'from-gray-50 via-white to-gray-100 dark:from-gray-900/60 dark:via-gray-950/80 dark:to-gray-900/60 border-gray-300 dark:border-gray-700',
              'plagiarism-checker':
                'from-orange-50 via-white to-orange-100 dark:from-orange-900/60 dark:via-orange-950/80 dark:to-orange-900/60 border-orange-300 dark:border-orange-700',
              'commit-graph':
                'from-sky-50 via-white to-sky-100 dark:from-sky-900/60 dark:via-sky-950/80 dark:to-sky-900/60 border-sky-300 dark:border-sky-700',
            };
            const Section = typeof window !== 'undefined' ? motion.section : 'section';
            return (
              <Section
                id={f.id}
                key={f.id}
                {...(typeof window !== 'undefined'
                  ? {
                      initial: { opacity: 0, y: 20 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.2 },
                      transition: { duration: 0.25 },
                    }
                  : {})}
                className={`mx-auto my-6 w-full max-w-2xl bg-gradient-to-br p-8 ${colorMap[f.id] || 'from-white to-gray-100'} relative flex flex-col items-center overflow-hidden rounded-2xl border shadow-xl`}
                style={{ scrollMarginTop: 90 }}
              >
                <div
                  className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full opacity-30 blur-2xl"
                  style={{ background: 'inherit' }}
                />
                <div
                  className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full opacity-20 blur-2xl"
                  style={{ background: 'inherit' }}
                />
                <h2 className="z-10 mb-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight drop-shadow-lg">
                  <span className="inline-block align-middle text-2xl">{f.icon}</span>
                  {f.label}
                </h2>
                {content}
              </Section>
            );
          })}
          <GitignoreModal open={showGitignore} onClose={() => setShowGitignore(false)} />
          <MarkdownGenModal open={showMarkdownGen} onClose={() => setShowMarkdownGen(false)} />
        </div>
      </Protect>
    </>
  );
};

export default Advanced;
