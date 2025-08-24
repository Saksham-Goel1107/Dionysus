'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FullscreenToggleProps {
  className?: string;
}

export function FullscreenToggle({ className }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
      const hasFullscreenAPI = document.documentElement.requestFullscreen !== undefined;
      setIsMobile(isMobileDevice || !hasFullscreenAPI);
    };

    checkMobile();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Don't render on mobile devices or if fullscreen API is not supported
  if (isMobile) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className={`hidden h-8 w-auto items-center gap-2 px-2 py-1 transition-colors hover:bg-accent hover:text-accent-foreground md:flex ${className ?? ''}`}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="text-xs font-medium">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
