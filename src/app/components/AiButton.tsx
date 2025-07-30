'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AiToolkitButton({
  setIsSidebarOpen,
}: {
  setIsSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  let timeout: NodeJS.Timeout;

  useEffect(() => {
    const handleCtrlQ = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setIsSidebarOpen((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleCtrlQ);
    return () => {
      window.removeEventListener('keydown', handleCtrlQ);
    };
  }, [setIsSidebarOpen]);

  const handleMouseEnter = () => {
    timeout = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeout);
    setShowTooltip(false);
  };

  return (
    <div className="relative z-50" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={() => {
          setIsSidebarOpen(true);
          document.body.style.overflow = 'hidden';
        }}
        className={`fixed bottom-[7rem] right-11 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white p-1 shadow-lg transition-colors`}
        aria-label="Open AI Assistant"
      >
        <Image src="/gemini.png" alt="Gemini" width={30} height={30} priority />
      </button>

      {showTooltip && (
        <div className="fixed bottom-[10rem] right-4 flex flex-col items-end space-y-1">
          <div
            className={`whitespace-nowrap rounded bg-white px-3 py-1 text-sm text-black shadow-md transition-opacity duration-300`}
          >
            💬 Ask AI
          </div>
        </div>
      )}
    </div>
  );
}
