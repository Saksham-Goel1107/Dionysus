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
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-gray-800 transition-colors dark:bg-black dark:text-gray-100">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500 dark:text-blue-400" />
      <p className="animate-pulse text-lg font-medium">{messages[messageIndex]}</p>
    </div>
  );
};

export default Loading;
