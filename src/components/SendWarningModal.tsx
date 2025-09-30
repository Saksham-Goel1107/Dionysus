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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/trpc/react';
import { Send } from 'lucide-react';
import { useState } from 'react';

interface SendWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  reason?: string;
}

export function SendWarningModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  reason,
}: SendWarningModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendWarning = api.user.sendWarning.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Warning email sent to ${userName} (${data.recipient})`,
      });
      // Reset form and close modal
      setSubject('');
      setMessage('');
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send warning email.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both subject and message fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      await sendWarning.mutateAsync({
        userId,
        subject: subject.trim(),
        message: message.trim(),
        reason,
      });
    } catch {
      // Error is handled in the mutation
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSubject('');
      setMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Warning Email</DialogTitle>
          <DialogDescription>
            Send a warning email to <strong>{userName}</strong> ({userEmail})
            {reason && (
              <>
                <br />
                <span className="text-orange-600 dark:text-orange-400">Reason: {reason}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your warning message..."
              rows={6}
              disabled={isSending}
            />
          </div>

          {reason && (
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Context:</strong> {reason}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSending || !subject.trim() || !message.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Send Warning
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Warning Email</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to send this warning email to <strong>{userName}</strong>?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSend}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Send Warning
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
