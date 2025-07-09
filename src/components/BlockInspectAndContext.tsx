'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const SSBox = () => {
  const [show, setShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerShow = () => {
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 6000);
  };

  useEffect(() => {
    const onCustomSSDetected = () => triggerShow();
    window.addEventListener('ss-detected', onCustomSSDetected);
    return () => {
      window.removeEventListener('ss-detected', onCustomSSDetected);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const share = () => {
    const shareText =
      "I'm using Dionysus – Your AI GitHub Assistant. Try it out! https://dionysus-gray.vercel.app";
    if (navigator.share) {
      navigator.share({
        title: 'Check out Dionysus!',
        text: shareText,
        url: 'https://dionysus-gray.vercel.app',
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard!');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-white dark:bg-gray-900 border border-blue-400 dark:border-blue-600 shadow-xl rounded-2xl px-6 py-5 flex flex-col items-center gap-2 animate-slide-up max-w-xs w-[90vw]">
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      <span className="text-gray-700 dark:text-gray-200 text-sm text-center">
        Like this site? Share it with your friends!
      </span>
      <button
        onClick={share}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
      >
        Share
      </button>
    </div>
  );
};

const BlockInspectAndContext = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    const showSSBox = () => {
      window.dispatchEvent(new Event('ss-detected'));
    };
    const blockInspect = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showSSBox();
        return false;
      }
      if (
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showSSBox();
        return false;
      }
      if (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
        showSSBox();
        return false;
      }
    };
    document.addEventListener('keydown', blockInspect, true);
    return () => {
      document.removeEventListener('keydown', blockInspect, true);
    };
  }, []);
  return (
    <>
      <SSBox />
    </>
  );
};

export default BlockInspectAndContext;
