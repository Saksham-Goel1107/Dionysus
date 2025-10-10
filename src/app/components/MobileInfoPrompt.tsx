'use client';
import { useEffect, useState } from 'react';

export default function MobileInfoPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768 && !localStorage.getItem('mobileInfoPromptDismissed')) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-slideUp relative flex w-[90vw] max-w-lg transform flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:w-[60vw]">
        {/* Close Button */}
        <button
          className="absolute right-3 top-3 text-2xl font-bold text-gray-400 transition-colors duration-200 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Dismiss info prompt"
          onClick={() => {
            setShow(false);
            localStorage.setItem('mobileInfoPromptDismissed', 'true');
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 shadow-inner dark:bg-blue-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600 dark:text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-blue-900 dark:text-blue-200">
          Recommended: Use on Desktop
        </h2>

        {/* Description */}
        <p className="mb-4 text-center text-base leading-relaxed text-gray-700 dark:text-gray-300">
          For the best experience, please use Dionysus on a PC or larger screen. Some features may
          not work optimally on mobile devices.
        </p>

        {/* Small note */}
        <p className="max-w-sm text-center text-xs text-gray-500 dark:text-gray-400">
          You can dismiss this message and continue on mobile, but for full functionality, we
          recommend using a desktop or laptop.
        </p>

        {/* Action button */}
        <button
          onClick={() => {
            setShow(false);
            localStorage.setItem('mobileInfoPromptDismissed', 'true');
          }}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
        >
          Continue Anyway
        </button>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
