'use client';

import Link from 'next/link';

import { Logo } from './logo';
import { ModeToggle } from './ThemeToggle';
import StarOnGithub from './starOnGithub';
import GetStartedButton from '@/components/shsfui/button/get-started-button';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user } = useUser();
  const userId = user?.id;
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-16">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex justify-between items-center px-2 md:hidden w-full">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-bold sm:inline-block">Dionysus</span>
            </div>
          </Link>
          <ModeToggle />
        </div>

        <Link className="hidden md:flex" href="/">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold sm:inline-block">Dionysus</span>
          </div>
        </Link>

        {isHome && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/about"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              About
            </Link>
            {/*
            <Link
              href="/status"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Status
            </Link>
            */}
            <Link
              href="#features"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              How It Works
            </Link>
            <Link href="/docs" className="text-sm font-medium transition-colors hover:text-primary">
              Docs
            </Link>
            <ModeToggle />
            <Link href={userId ? '/dashboard' : '/sign-in'}>
              <GetStartedButton />
            </Link>
            <StarOnGithub />
          </nav>
        )}

        {!isHome && (
          <div className="hidden md:flex items-center gap-5">
            <ModeToggle />
            <Link href={userId ? '/dashboard' : '/sign-in'}>
              <GetStartedButton />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
