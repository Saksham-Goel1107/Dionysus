'use client';

import { useState, useEffect } from 'react';

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🍪 We Respect Your Privacy
        </h2>
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          This site uses essential third-party cookies to securely authenticate users and enable
          critical features of the service. <br className="hidden sm:inline" />
          We <strong className="font-semibold text-gray-900 dark:text-white">never</strong> use
          cookies for advertising or marketing purposes.
          <br className="hidden sm:inline" />
          For better product analysis and reliability, we may collect anonymized session replays to
          understand how the service is used and improve user experience. These replays do{' '}
          <strong className="font-semibold text-gray-900 dark:text-white">not</strong> include
          personal or sensitive data and are never used for marketing or advertising.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          For reliability and security, we may collect anonymized error, crash reports, and session
          replays. These never include personal or sensitive data, and are only used to improve the
          service and user experience.
        </p>
        <p className="text-sm">
          Additionally, AI conversations may be recorded solely to help us improve business
          development and understanding of our services. These recordings do{' '}
          <strong className="font-semibold text-gray-900 dark:text-white">not</strong> include
          personal or sensitive data, and are never used for marketing or research purposes.
        </p>
        <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
          <button
            onClick={handleAccept}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full px-6 py-2.5 shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
          >
            Accept & Continue
          </button>
          <button
            onClick={handleLeave}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold text-sm rounded-full px-6 py-2.5 shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          >
            Leave Site
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          By clicking &quot;Accept & Continue&quot;, you agree to our cookie and data policies. If
          you do not wish to accept, you may leave the site.
        </p>
      </div>
    </div>
  );
}
