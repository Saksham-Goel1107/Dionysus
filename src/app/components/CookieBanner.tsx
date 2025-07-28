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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 shadow-xl backdrop-blur-sm px-6 py-6 md:px-8 md:py-8 text-center transition-all duration-300">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          🍪 Cookie Policy & Privacy Notice
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          We use cookies for essential functionality and anonymized analytics to improve your
          experience. We respect your privacy and never use cookies for advertising purposes.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          <Link
            href="/cookie-policy"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            View our detailed Cookie & Privacy Policy
          </Link>
        </p>
        <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
          <button
            onClick={handleAccept}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full px-5 py-2 shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 w-full md:w-auto"
          >
            Accept & Continue
          </button>
          <button
            onClick={handleLeave}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold text-sm rounded-full px-5 py-2 shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900 w-full md:w-auto"
          >
            Leave Site
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          By clicking &quot;Accept & Continue&quot;, you consent to our cookie usage as detailed in
          our policy.
        </p>
      </div>
    </div>
  );
}
