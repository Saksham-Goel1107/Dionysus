'use client';

import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/nextjs';

const TUTORIAL_KEY = 'userButtonTutorialCompleted';

export default function UserButtonTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (!showTutorial) return;

    const handleUserButtonDoubleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const userButtonContainer = target.closest('[data-user-button]');
      if (userButtonContainer) {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        setShowTutorial(false);
      }
    };

    document.addEventListener('dblclick', handleUserButtonDoubleClick);
    return () => {
      document.removeEventListener('dblclick', handleUserButtonDoubleClick);
    };
  }, [showTutorial]);

  if (!showTutorial || process.env.NODE_ENV !== 'production') return null;

  return (
    <div className="fixed right-4 top-20 z-[9999] w-80">
      <div className="pointer-events-auto relative flex flex-col items-center rounded-2xl border border-gray-300 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Quick Tutorial</h2>
        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Double-click the <span className="font-semibold">real user button</span> in the header
          (top right corner) to open your profile menu.
        </p>

        <div className="pointer-events-none mb-4 opacity-60">
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          (Popup will close after a real double-click on the actual header button)
        </div>
      </div>
    </div>
  );
}
