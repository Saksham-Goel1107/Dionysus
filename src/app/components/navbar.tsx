"use client";

import Link from "next/link";

import { useState } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-16">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold sm:inline-block">Dionysus</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
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
          {/* <Link href="#" className="text-sm font-medium transition-colors hover:text-primary">
            Docs
          </Link> */}
          <Button onClick={() => router.push("/sign-in")}>Get Started</Button>
        </nav>
      </div>
    </header>
  );
}
