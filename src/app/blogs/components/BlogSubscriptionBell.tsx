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

export default function BlogSubscriptionBell() {
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
            `/api/blog-subscription/status?email=${encodeURIComponent(user.emailAddresses[0].emailAddress)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setIsSubscribed(data.subscribed);
          }
        } catch (error) {
          console.error('Error checking blog subscription status:', error);
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

      const response = await fetch('/api/blog-subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail, name: subscribeName }),
      });

      if (response.ok) {
        toast.success('Successfully subscribed to blog updates!');
        setIsSubscribed(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Blog subscribe error:', error);
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

      const response = await fetch('/api/blog-subscription/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unsubscribeEmail }),
      });

      if (response.ok) {
        toast.success('Successfully unsubscribed from blog updates!');
        setIsSubscribed(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Blog unsubscribe error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="outline" disabled className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking...</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      {isSubscribed ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="h-4 w-4 text-orange-500" />
              )}
              <span>Subscribed</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Unsubscribe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unsubscribe from blog updates? You will no longer receive
                notifications about new blog posts.
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
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            <Bell className="h-4 w-4" />
            <span>Subscribe to Updates</span>
          </Button>

          {/* Authentication Required Modal */}
          <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Authentication Required</DialogTitle>
                <DialogDescription>
                  You need to sign in to subscribe to blog updates. This helps us send you relevant
                  updates about new blog posts.
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
  );
}
