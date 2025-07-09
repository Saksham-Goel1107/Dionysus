'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const messages = [
  'Authenticating...',
  'Fetching user details...',
  'Saving to database...',
  'Redirecting to dashboard...',
];

const Loading = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-black text-gray-800 dark:text-gray-100 transition-colors">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500 dark:text-blue-400 mb-4" />
      <p className="text-lg font-medium animate-pulse">{messages[messageIndex]}</p>
    </div>
  );
};

export default Loading;
