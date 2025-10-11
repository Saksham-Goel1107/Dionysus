'use client';

import { Github, Home, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute left-[-100px] top-[-100px] z-0 h-[300px] w-[300px] rounded-full bg-blue-500 opacity-20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] z-0 h-[350px] w-[350px] rounded-full bg-indigo-500 opacity-20 blur-3xl" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
          <AlertTriangle className="h-12 w-12 text-white" />
        </div>

        <h1 className="mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-8xl font-extrabold text-transparent dark:from-slate-100 dark:to-slate-400 md:text-9xl">
          404
        </h1>

        <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
          Page Not Found
        </h2>

        <p className="mb-8 max-w-md text-lg text-slate-600 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="transition-transform hover:scale-105">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            size="lg"
            className="transition-transform hover:scale-105"
          >
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-12 rounded-lg border border-slate-200 bg-white/50 p-6 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
            Think this is an error?
          </h3>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            If you believe this page should exist, please report it on our GitHub repository.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/saksham-goel1107/dionysus/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" />
              Report on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
