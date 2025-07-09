import Link from 'next/link';
import { Logo } from './logo';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t bg-background px-20">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold">Dionysus</span>
        </div>
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6">
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
          <Link
            href="/privacy"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <Link href="/terms" className="text-sm font-medium transition-colors hover:text-primary">
            Terms & Conditions
          </Link>
          <Link
            href="/support"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Support
          </Link>
        </div>
        <div className="flex items-center gap-4">
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
        </div>
      </div>
      <div className="container py-4 text-center text-sm text-muted-foreground md:py-2">
        &copy; {new Date().getFullYear()} Dionysus. All rights reserved.
      </div>
    </footer>
  );
}
