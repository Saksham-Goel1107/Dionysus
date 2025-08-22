'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

const FullscreenPrompt: React.FC = () => {
  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('fullscreenPromptDismissed') !== 'true';
    }
    return true;
  });
  const [isMobile, setIsMobile] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function checkMobile() {
      const mobile =
        window.innerWidth <= 768 ||
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      if (mobile) {
        setShow(false);
        sessionStorage.setItem('fullscreenPromptDismissed', 'true');
      }
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);

    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShow(false);
        sessionStorage.setItem('fullscreenPromptDismissed', 'true');
      }
    }
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);

  useEffect(() => {
    if (window.innerHeight === screen.height && window.innerWidth === screen.width) {
      setShow(false);
      sessionStorage.setItem('fullscreenPromptDismissed', 'true');
    }
  }, []);

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
    setShow(false);
    sessionStorage.setItem('fullscreenPromptDismissed', 'true');
  };

  if (!show || isMobile) return null;

  return (
    <div className="fixed right-3 top-[68px] z-40">
      <div
        ref={popupRef}
        className="flex min-w-[220px] max-w-xs flex-col items-center rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
      >
        <span className="mb-1 font-medium">Fullscreen available</span>
        <span className="mb-2 text-center text-xs text-gray-500">
          Click below to enter fullscreen mode (optional)
        </span>
        <Button onClick={handleFullscreen} size="sm" className="w-full px-2 py-1 text-xs">
          Go Fullscreen
        </Button>
      </div>
    </div>
  );
};

export default FullscreenPrompt;
