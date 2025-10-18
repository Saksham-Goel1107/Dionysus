'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
  params: { projectId: string; inviteToken: string };
};

const JoinHandlerWithToken = ({ params }: Props) => {
  const { projectId, inviteToken } = params;
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const handleClose = () => {
    router.push('/dashboard');
  };
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const joinProject = async () => {
      try {
        const response = await fetch('/api/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            inviteToken,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setResult({ success: true, message: data.message });
        } else {
          setResult({ success: false, error: data.error });
        }
      } catch (error) {
        console.error('Error calling join API:', error);
        setResult({ success: false, error: 'Failed to process join request' });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && inviteToken) {
      joinProject();
    } else {
      setResult({ success: false, error: 'Missing project ID or invite token' });
      setIsLoading(false);
    }
  }, [projectId, inviteToken]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {result?.success ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <DialogTitle>{result?.success ? 'Success!' : 'Error'}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {result?.success ? result.message : result?.error}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinHandlerWithToken;
