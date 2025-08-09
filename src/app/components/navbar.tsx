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
import { Menu, X, Heart, Loader2 } from 'lucide-react';
import GradientTypewriter from '@/components/mvpblocks/gradient-typewriter';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, isLoaded } = useUser();
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsOnboarding(user?.publicMetadata?.isOnboarding !== false);
    }
  }, [user, isLoaded]);

  const userId = user?.id;
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [surveyDone, setSurveyDone] = useState<boolean | null>(null);
  useEffect(() => {
    if (userId && isOnboarding) {
      fetch('/api/survey-status')
        .then(res => res.json())
        .then(data => setSurveyDone(data.done))
        .catch(() => setSurveyDone(null));
    }
  }, [userId, isOnboarding]);

  const getStartHref = userId
    ? !isOnboarding
      ? '/onboarding'
      : surveyDone === false
        ? '/survey-check'
        : '/dashboard'
    : '/sign-in';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-3 sm:px-6 lg:px-16 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">

        {/* Mobile Logo + Menu */}
        <div className="flex w-full items-center justify-between md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <GradientTypewriter words="Dionysus" />
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Logo */}
        <Link href="/" className="hidden md:flex items-center gap-2">
          <Logo />
          <GradientTypewriter words="Dionysus" />
        </Link>

        {/* Desktop Nav */}
        {isHome && (
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/status" className="nav-link">Status</Link>
            <a href="#features" className="nav-link">Features</a>
            <Link href="/docs" className="nav-link">Docs</Link>
            <ModeToggle />
            {!isLoaded ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Link href={getStartHref}>
                <GetStartedButton />
              </Link>
            )}
            <StarOnGithub />
            <Battery />
            <a href="https://www.buymeacoffee.com/saksham07" target="_blank" rel="noopener noreferrer">
              <Image className="rounded-full" src="/Coffee.png" alt="Buy me a coffee" width={40} height={40} />
            </a>
            <a href="https://github.com/sponsors/Saksham-Goel1107" target="_blank" rel="noopener noreferrer" className="group">
              <Heart className="h-6 w-6 transition-all duration-200 group-hover:scale-125 group-hover:text-red-500" />
            </a>
          </nav>
        )}

        {!isHome && (
          <div className="hidden md:flex items-center gap-5">
            <ModeToggle />
            <Link href={getStartHref}>
              <GetStartedButton />
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden absolute left-0 right-0 top-16 bg-background border-b shadow-lg"
          >
            <nav className="flex flex-col gap-3 p-4">
              <Link href="/about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/status" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Status</Link>
              <a href="#features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <Link href="/docs" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <ModeToggle />
                {!isLoaded ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Link href={getStartHref} onClick={() => setMobileMenuOpen(false)}>
                    <GetStartedButton />
                  </Link>
                )}
                <StarOnGithub />
                <Battery />
                <a href="https://www.buymeacoffee.com/saksham07" target="_blank" rel="noopener noreferrer">
                  <Image className="rounded-full" src="/Coffee.png" alt="Buy me a coffee" width={32} height={32} />
                </a>
                <a href="https://github.com/sponsors/Saksham-Goel1107" target="_blank" rel="noopener noreferrer" className="group">
                  <Heart className="h-5 w-5 transition-all duration-200 group-hover:scale-125 group-hover:text-red-500" />
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Tailwind extra utilities for cleaner markup
// Add in globals.css
// .nav-link { @apply text-sm font-medium transition-colors hover:text-primary; }
// .mobile-link { @apply text-base font-medium transition-colors hover:text-primary; }
