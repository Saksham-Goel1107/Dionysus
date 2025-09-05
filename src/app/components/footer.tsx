'use client';
import Link from 'next/link';
import { Logo } from './logo';
import { Github, Twitter, Linkedin, Loader2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/kibo-ui/theme-switcher';
import { FullscreenToggle } from './FullscreenToggle';
import { useTheme } from 'next-themes';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import GradientTypewriter from '@/components/mvpblocks/gradient-typewriter';
import Image from 'next/image';
import { UptimeStatus } from './UptimeStatus';

export function Footer() {
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState<string>();
  useEffect(() => {
    if (!isLoaded) return;
    const userid = user?.id;
    setUserId(userid);
  }, [user, isLoaded]);
  const { setTheme } = useTheme();
  return (
    <footer className="w-full border-t bg-background px-4 sm:px-8 md:px-20">
      <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-6">
        <div className="flex min-w-[120px] flex-col items-center gap-2 md:items-start">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Logo />
              <GradientTypewriter words="Dionysus" />
            </div>
          </Link>
          <div className="flex flex-col items-center gap-2 md:items-start">
            <ThemeSwitcher
              className="mt-0.5"
              defaultValue="system"
              onChange={(theme) => {
                if (typeof window !== 'undefined') {
                  setTheme(theme);
                }
              }}
            />
            <FullscreenToggle className="mt-1" />
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:gap-4 md:w-auto md:gap-6">
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/blogs" className="text-sm font-medium transition-colors hover:text-primary">
            Blogs
          </Link>
          <Link
            href="/status"
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
          >
            Status <UptimeStatus />
          </Link>
          <Link href="/docs" className="text-sm font-medium transition-colors hover:text-primary">
            Docs
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <Link
            href="/cookie-policy"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Cookies
          </Link>
          <Link href="/terms" className="text-sm font-medium transition-colors hover:text-primary">
            Terms & Conditions
          </Link>
          {!isLoaded ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Link
              href={`${userId ? '/supportAuth' : '/support'}`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Support
            </Link>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:gap-4 md:w-auto md:justify-end md:gap-6">
          <a
            rel="noopener noreferrer"
            href="https://github.com/Saksham-Goel1107/Dionysus"
            target="_blank"
            className="hover:text-primary"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            rel="noopener noreferrer"
            href="https://x.com/Saksham1199805"
            target="_blank"
            className="hover:text-primary"
          >
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </a>
          <a
            rel="noopener noreferrer"
            href="https://www.linkedin.com/in/saksham-goel-88b74b33a"
            target="_blank"
            className="hover:text-primary"
          >
            <Linkedin className="h-5 w-5" />
            <span className="sr-only">LinkedIn</span>
          </a>
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
      <div className="container py-4 text-center text-xs text-muted-foreground sm:text-sm md:py-2">
        &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
      </div>
    </footer>
  );
}
