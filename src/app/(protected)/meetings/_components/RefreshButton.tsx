'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface RefreshButtonProps {
  meetingId: string;
  status?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export default function RefreshButton({
  meetingId,
  status,
  variant = 'outline',
  size = 'sm',
  showText = true,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    'idle' | 'checking' | 'processing' | 'completing'
  >('idle');
  const refetch = useRefetch();

  // Cleanup effect to prevent stuck loading states
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      toast.dismiss(`refresh-${meetingId}`);
    };
  }, [meetingId]);

  const syncMeetingStatus = api.project.syncMeetingStatus.useMutation({
    onSuccess: (_data) => {
      setLoadingStage('completing');
      toast.dismiss(`refresh-${meetingId}`);

      // Show completion state briefly before resetting
      setTimeout(() => {
        toast.success('Meeting refreshed successfully');
        setLoadingStage('idle');
        setIsRefreshing(false);
        refetch();
      }, 800);
    },
    onError: (error) => {
      setLoadingStage('idle');
      toast.dismiss(`refresh-${meetingId}`);
      toast.error(`Failed to refresh meeting: ${error.message}`);
      setIsRefreshing(false);
    },
    onSettled: () => {
      // Ensure loading states are always reset after a delay
      setTimeout(() => {
        setLoadingStage('idle');
        setIsRefreshing(false);
      }, 1000);
    },
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setLoadingStage('checking');

    // Show initial checking toast
    toast.loading('Checking meeting status...', {
      id: `refresh-${meetingId}`,
      description: 'Connecting to server',
    });

    try {
      // Start processing immediately
      setLoadingStage('processing');
      toast.loading('Processing meeting data...', {
        id: `refresh-${meetingId}`,
        description: 'This may take a few moments',
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(`refresh-${meetingId}`),
        },
      });

      await syncMeetingStatus.mutateAsync({ meetingId });
    } catch (error) {
      // Ensure we reset states on any error
      setLoadingStage('idle');
      setIsRefreshing(false);
      toast.dismiss(`refresh-${meetingId}`);
      console.error('Refresh failed:', error);
    }
  };

  // Get appropriate icon and animation based on loading stage
  const getRefreshIcon = () => {
    if (loadingStage === 'completing') {
      return <Check className="h-4 w-4 text-green-600 transition-all duration-300" />;
    }

    const shouldSpin = loadingStage === 'checking' || loadingStage === 'processing';
    return (
      <RefreshCw
        className={`h-4 w-4 transition-all duration-300 ${
          shouldSpin ? 'animate-spin' : ''
        } ${loadingStage === 'idle' ? 'hover:rotate-45' : ''}`}
      />
    );
  };

  const getButtonText = () => {
    switch (loadingStage) {
      case 'checking':
        return 'Checking...';
      case 'processing':
        return 'Processing...';
      case 'completing':
        return 'Complete!';
      default:
        return 'Refresh';
    }
  };

  const getTooltipText = () => {
    switch (loadingStage) {
      case 'checking':
        return 'Checking meeting status with server...';
      case 'processing':
        return 'Processing meeting data...';
      case 'completing':
        return 'Refresh completed successfully';
      default:
        return 'Refresh meeting from server';
    }
  };

  // Show subtle check icon for completed meetings with tooltip
  if (status === 'COMPLETED') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Meeting processing completed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show alert icon for failed meetings with tooltip and retry option
  if (status === 'FAILED') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size={size}
              className="flex h-8 w-8 items-center justify-center rounded-full border-red-200 bg-red-50 p-0 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30"
            >
              {isRefreshing ? (
                getRefreshIcon()
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRefreshing ? getTooltipText() : 'Meeting processing failed - click to retry'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant={variant}
            size={size}
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            {getRefreshIcon()}
            {showText && size !== 'icon' && (
              <span className="hidden sm:inline">{getButtonText()}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
