'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
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

    // Simulate brief checking period for better UX
    setTimeout(() => {
      setLoadingStage('processing');
      toast.loading('Processing meeting data...', {
        id: `refresh-${meetingId}`,
        description: 'This may take a few moments',
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(`refresh-${meetingId}`),
        },
      });
    }, 600);

    try {
      await syncMeetingStatus.mutateAsync({ meetingId });
    } catch {
      // Error handling is done in onError callback
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
