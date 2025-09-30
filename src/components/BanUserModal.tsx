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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { Ban } from 'lucide-react';
import { useState } from 'react';

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  reason?: string;
  isCurrentlyBanned?: boolean;
}

export function BanUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  reason,
  isCurrentlyBanned = false,
}: BanUserModalProps) {
  const [banReason, setBanReason] = useState(reason || '');
  const [isBanning, setIsBanning] = useState(false);
  const { toast } = useToast();

  const toggleBan = api.user.toggleBan.useMutation({
    onSuccess: () => {
      toast({
        title: 'User Banned',
        description: `${userName} (${userEmail}) has been banned successfully.`,
        variant: 'destructive',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to ban user.',
        variant: 'destructive',
      });
    },
  });

  const isBanAction = !isCurrentlyBanned;

  const handleAction = async () => {
    if (isBanAction && !banReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for banning this user.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsBanning(true);
      await toggleBan.mutateAsync({
        userId,
        banned: isBanAction,
        reason: isBanAction ? banReason.trim() : undefined,
      });
    } catch {
      // Error is handled in the mutation
    } finally {
      setIsBanning(false);
    }
  };

  const handleClose = () => {
    if (!isBanning) {
      setBanReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={isBanAction ? 'text-red-600' : 'text-green-600'}>
            {isBanAction ? 'Ban User' : 'Unban User'}
          </DialogTitle>
          <DialogDescription>
            {isBanAction ? (
              <>
                Ban <strong>{userName}</strong> ({userEmail})
                <br />
                <span className="font-medium text-red-600">
                  This action will permanently restrict the user from accessing the platform.
                </span>
              </>
            ) : (
              <>
                Unban <strong>{userName}</strong> ({userEmail})
                <br />
                <span className="font-medium text-green-600">
                  This will restore the user&apos;s access to the platform.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isBanAction && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for ban *</Label>
              <Textarea
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Provide a detailed reason for banning this user..."
                rows={4}
                disabled={isBanning}
              />
            </div>
          )}

          {reason && isBanAction && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Context:</strong> {reason}
              </p>
            </div>
          )}

          <div className={`rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20`}>
            <p
              className={`text-sm ${isBanAction ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'}`}
            >
              <strong>Warning:</strong>{' '}
              {isBanAction
                ? 'Banned users will lose access to all their data and cannot create new accounts with the same email.'
                : "Unbanning will restore the user's access to the platform immediately."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isBanning}>
            Cancel
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isBanning || (isBanAction && !banReason.trim())}
                variant={isBanAction ? 'destructive' : 'default'}
                className={isBanAction ? '' : 'bg-green-600 hover:bg-green-700'}
              >
                <Ban className="mr-2 h-4 w-4" />
                {isBanAction ? 'Ban User' : 'Unban User'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirm {isBanAction ? 'User Ban' : 'User Unban'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {isBanAction ? 'ban' : 'unban'}{' '}
                  <strong>{userName}</strong> ({userEmail})?
                  {isBanAction
                    ? ' This will permanently suspend their account and cannot be easily undone.'
                    : ' This will restore their access to the platform immediately.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAction}
                  className={
                    isBanAction ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }
                >
                  {isBanAction ? 'Ban User' : 'Unban User'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
