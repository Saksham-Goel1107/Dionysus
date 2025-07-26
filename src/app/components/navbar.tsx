'use client';

import Link from 'next/link';

import { Logo } from './logo';
import { ModeToggle } from './ThemeToggle';
import StarOnGithub from './starOnGithub';
import GetStartedButton from '@/components/shsfui/button/get-started-button';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Battery from './Battery';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import GradientTypewriter from '@/components/mvpblocks/gradient-typewriter';
import Image from 'next/image';

export function Navbar() {
  const { user, isLoaded } = useUser();
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded) return;
    setIsOnboarding(user?.publicMetadata?.isOnboarding !== false);
  }, [user, isLoaded]);
  const userId = user?.id;
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [surveyDone, setSurveyDone] = useState<boolean | null>(null);
  useEffect(() => {
    if (userId && isOnboarding) {
      fetch('/api/survey-status')
        .then((res) => res.json())
        .then((data) => setSurveyDone(data.done))
        .catch(() => setSurveyDone(null));
    }
  }, [userId, isOnboarding]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-16">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex justify-between items-center px-2 md:hidden w-full">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Logo />
              <GradientTypewriter words="Dionysus" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <a
              href="https://www.buymeacoffee.com/saksham07"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="rounded-full"
                src="/Coffee.png"
                alt="Buy me a coffee"
                width={40}
                height={40}
              />
            </a>
          </div>
        </div>

        <Link className="hidden md:flex" href="/">
          <div className="flex items-center gap-2">
            <Logo />
            <GradientTypewriter words="Dionysus" />
          </div>
        </Link>

        {isHome && (
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/about"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              About
            </Link>
            <Link
              href="/status"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Status
            </Link>
            <a
              href="#features"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              How It Works
            </a>
            <Link href="/docs" className="text-sm font-medium transition-colors hover:text-primary">
              Docs
            </Link>
            <ModeToggle />
            {!isLoaded ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Link
                href={
                  userId
                    ? !isOnboarding
                      ? '/onboarding'
                      : surveyDone === false
                        ? '/survey-check'
                        : '/dashboard'
                    : '/sign-in'
                }
              >
                <GetStartedButton />
              </Link>
            )}
            <StarOnGithub />
            <Battery />
            <a
              href="https://www.buymeacoffee.com/saksham07"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="rounded-full"
                src="/Coffee.png"
                alt="Buy me a coffee"
                width={40}
                height={40}
              />
            </a>
          </nav>
        )}

        {!isHome && (
          <div className="hidden md:flex items-center gap-5">
            <ModeToggle />
            <Link
              href={
                userId
                  ? !isOnboarding
                    ? '/onboarding'
                    : surveyDone === false
                      ? '/survey-check'
                      : '/dashboard'
                  : '/sign-in'
              }
            >
              <GetStartedButton />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
