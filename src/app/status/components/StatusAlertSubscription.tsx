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
import { useUser } from '@clerk/nextjs';
import { Bell, BellOff, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function StatusAlertSubscription() {
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
      <div className="mt-8 border-t pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Status Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Get notified when there are updates to our system status
            </p>
          </div>
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Status Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Get notified when there are updates to our system status
          </p>
        </div>

        {isSubscribed ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BellOff className="mr-2 h-4 w-4" />
                )}
                Unsubscribe
              </Button>
            </AlertDialogTrigger>
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
            <Button onClick={handleSubscribe} disabled={isLoading}>
              <Bell className="mr-2 h-4 w-4" />
              Subscribe to Alerts
            </Button>

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
    </div>
  );
}
