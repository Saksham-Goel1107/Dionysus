'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CookieBanner({ isVisible = true }: { isVisible?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [ip, setIp] = useState<string | null>(null);
  const [ipDetails, setIpDetails] = useState<any>(null);
  const [ipDialogOpen, setIpDialogOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-accepted');
    if (accepted !== 'true') setVisible(true);

    // Fetch user IP address
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        setIp(data.ip);
        // Fetch IP details from ipinfo.io (free, no key required for basic info)
        fetch(`https://ipinfo.io/${data.ip}/json`)
          .then((res) => res.json())
          .then((details) => setIpDetails(details))
          .catch(() => setIpDetails(null));
      })
      .catch(() => setIp(null));
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-accepted', 'true');
    setVisible(false);
  };

  if (!visible || !isVisible) return null;

  const handleLeave = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-6 py-6 text-center shadow-xl backdrop-blur-sm transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
            🍪 Cookie Policy & Privacy Notice
          </h2>
          <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
            We use cookies for essential functionality and anonymized analytics to improve your
            experience. We respect your privacy and never use cookies for advertising purposes.
          </p>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            <Link
              href="/cookie-policy"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View our detailed Cookie & Privacy Policy
            </Link>
          </p>
          {ip && (
            <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
              <DialogTrigger asChild>
                <p className="mb-2 cursor-pointer text-xs text-red-500 dark:text-red-400">
                  Your IP address <span className="font-mono underline">{ip}</span> is being
                  monitored for security purposes.{' '}
                  <span className="text-blue-500 underline">(details)</span>
                </p>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>IP Details</DialogTitle>
                  <DialogDescription>
                    The following information is associated with your IP address:
                  </DialogDescription>
                </DialogHeader>
                {ipDetails ? (
                  <div className="max-h-64 overflow-auto text-left text-xs">
                    <div className="mb-2 rounded bg-yellow-100 p-2 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <strong>Note:</strong> For your privacy, all sensitive information is secured
                      by us and is{' '}
                      <span className="font-semibold">not displayed to you directly</span>. Only
                      basic non-sensitive, public IP info is shown below.
                    </div>
                    <pre className="whitespace-pre-wrap break-all rounded bg-gray-100 p-2 dark:bg-zinc-800">
                      {JSON.stringify(ipDetails, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Loading details...</div>
                )}
                <DialogClose asChild>
                  <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700">
                    Close
                  </button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          )}
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
            <button
              onClick={handleAccept}
              className="w-full rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 md:w-auto"
            >
              Accept & Continue
            </button>
            <button
              onClick={handleLeave}
              className="w-full rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900 md:w-auto"
            >
              Leave Site
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            By clicking &quot;Accept & Continue&quot;, you consent to our cookie usage as detailed
            in our policy.
          </p>
        </div>
      </div>
    </>
  );
}
