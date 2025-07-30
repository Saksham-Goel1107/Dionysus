'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-accepted');
    if (accepted !== 'true') setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const handleLeave = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
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
          By clicking &quot;Accept & Continue&quot;, you consent to our cookie usage as detailed in
          our policy.
        </p>
      </div>
    </div>
  );
}
