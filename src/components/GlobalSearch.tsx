'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, X, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load Google Custom Search when modal opens
  useEffect(() => {
    if (isOpen) {
      // Remove any existing script and style
      const existingScript = document.querySelector('script[src*="cse.google.com"]');
      const existingStyle = document.querySelector('style[data-global-search]');

      if (existingScript) existingScript.remove();
      if (existingStyle) existingStyle.remove();

      const script = document.createElement('script');
      script.src = `https://cse.google.com/cse.js?cx=${process.env.NEXT_PUBLIC_GOOGLE_CSE_ID || 'your-search-engine-id'}`;
      script.async = true;
      script.onload = () => {
        // Initialize the search after script loads
        if (
          typeof window !== 'undefined' &&
          window.google &&
          window.google.search &&
          window.google.search.cse &&
          window.google.search.cse.element &&
          typeof window.google.search.cse.element.render === 'function'
        ) {
          window.google.search.cse.element.render({
            div: 'gcse-search-global',
            tag: 'search',
          });
        }
      };
      document.head.appendChild(script);

      const style = document.createElement('style');
      style.setAttribute('data-global-search', 'true');
      style.textContent = `
        .gsc-control-cse {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .gsc-input-box {
          background-color: hsl(var(--background)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 6px !important;
        }
        .gsc-input {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          font-size: 14px !important;
          padding: 8px 12px !important;
        }
        .gsc-search-button {
          background-color: hsl(var(--primary)) !important;
          border: 1px solid hsl(var(--primary)) !important;
          border-radius: 6px !important;
        }
        .gsc-search-button:hover {
          background-color: hsl(var(--primary)/0.9) !important;
        }
        .dark .gsc-control-cse {
          background-color: transparent !important;
          border: none !important;
        }
        .dark .gsc-input-box {
          background-color: hsl(var(--background)) !important;
          border: 1px solid hsl(var(--border)) !important;
        }
        .dark .gsc-input {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .dark .gsc-search-button {
          background-color: hsl(var(--primary)) !important;
          border: 1px solid hsl(var(--primary)) !important;
        }
        .dark .gsc-search-button:hover {
          background-color: hsl(var(--primary)/0.9) !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const quickSuggestions = [
    'React documentation',
    'TypeScript examples',
    'Next.js tutorials',
    'GitHub best practices',
    'TailwindCSS components',
    'Node.js examples',
    'JavaScript fundamentals',
    'CSS grid layouts',
  ];

  const programmingSuggestions = [
    'How to debug React components',
    'Best practices for API design',
    'TypeScript interface vs type',
    'Git workflow best practices',
    'Database optimization techniques',
    'Authentication implementation',
    'Performance optimization tips',
    'Testing strategies',
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 pt-[10vh] backdrop-blur-sm"
      style={{
        animation: isOpen ? 'fadeIn 0.2s ease-out' : undefined,
      }}
    >
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
      `}</style>

      <div
        className="relative mx-4 max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/50 dark:to-indigo-950/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-semibold text-foreground">Global Search</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-xs text-muted-foreground sm:block">
              Press{' '}
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">
                Esc
              </kbd>{' '}
              to close
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(80vh-120px)] space-y-6 overflow-y-auto p-4">
          {/* Google Custom Search */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" />
              Search on Google
            </div>
            <div
              ref={searchContainerRef}
              id="gcse-search-global"
              className="gcse-search"
              data-resultsurl=""
              data-newwindow="true"
              data-linktarget="_blank"
            ></div>
          </div>

          {/* Quick Suggestions */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Quick Searches
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const searchInput = document.querySelector(
                      '#gcse-search-global input[type="text"]',
                    ) as HTMLInputElement;
                    if (searchInput) {
                      searchInput.value = suggestion;
                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                  className="rounded-md border border-border bg-muted px-3 py-2 text-left text-xs transition-colors hover:bg-muted/80"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Programming Help Suggestions */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Programming Help
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {programmingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const searchInput = document.querySelector(
                      '#gcse-search-global input[type="text"]',
                    ) as HTMLInputElement;
                    if (searchInput) {
                      searchInput.value = suggestion;
                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                  className="rounded-md border border-border bg-muted px-3 py-2 text-left text-xs transition-colors hover:bg-muted/80"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Button variant="outline" size="sm" onClick={handleClose} className="h-7 text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
