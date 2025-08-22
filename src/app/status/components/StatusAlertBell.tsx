'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function StatusAlertBell() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check subscription status when component mounts or user changes
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (isSignedIn && user?.emailAddresses[0]?.emailAddress) {
        setCheckingStatus(true);
        try {
          const response = await fetch(
            `/api/status-alerts/status?email=${encodeURIComponent(user.emailAddresses[0].emailAddress)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setIsSubscribed(data.subscribed);
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
        } finally {
          setCheckingStatus(false);
        }
      }
    };

    checkSubscriptionStatus();
  }, [isSignedIn, user]);

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const subscribeEmail = user?.emailAddresses[0]?.emailAddress;
      const subscribeName = user?.fullName || user?.firstName || 'User';

      if (!subscribeEmail || !subscribeName) {
        toast.error('Unable to get your account information');
        return;
      }

      const response = await fetch('/api/status-alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail, name: subscribeName }),
      });

      if (response.ok) {
        toast.success('Successfully subscribed to status alerts!');
        setIsSubscribed(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!isSignedIn) {
      return;
    }

    setIsLoading(true);
    try {
      const unsubscribeEmail = user?.emailAddresses[0]?.emailAddress;

      const response = await fetch('/api/status-alerts/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unsubscribeEmail }),
      });

      if (response.ok) {
        toast.success('Successfully unsubscribed from status alerts!');
        setIsSubscribed(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-5 w-5 animate-spin" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Checking subscription status...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center">
        {isSubscribed ? (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <BellOff className="h-5 w-5 text-orange-500" />
                    )}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unsubscribe from status alerts</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Unsubscribe</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to unsubscribe from status alerts? You will no longer
                  receive notifications about system updates.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnsubscribe} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unsubscribing...
                    </>
                  ) : (
                    'Unsubscribe'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSubscribe} disabled={isLoading}>
                  <Bell className="h-5 w-5 text-blue-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Subscribe to status alerts</p>
              </TooltipContent>
            </Tooltip>

            {/* Authentication Required Modal */}
            <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Authentication Required</DialogTitle>
                  <DialogDescription>
                    You need to sign in to subscribe to status alerts. This helps us send you
                    relevant updates.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAuthModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => router.push('/sign-in')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
