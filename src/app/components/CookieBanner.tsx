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
          cookies for advertising or tracking purposes.
        </p>
        <button
          onClick={handleAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full px-6 py-2.5 shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
