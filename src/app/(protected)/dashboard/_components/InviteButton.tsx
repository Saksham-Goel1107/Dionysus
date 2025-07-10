'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import useRefetch from '@/hooks/use-refetch';
import { useQueryClient } from '@tanstack/react-query';

const InviteButton = () => {
  const { projectId, project } = useProject();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const refetch = useRefetch();
  const queryClient = useQueryClient();

  const [currentInviteToken, setCurrentInviteToken] = useState<string | null>(null);

  const { data: isCreator, isLoading: creatorLoading } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const {
    data: projectDetails,
    isLoading: detailsLoading,
    refetch: refetchProjectDetails,
  } = api.project.getProjectById.useQuery({ projectId }, { enabled: !!projectId });

  const regenerateInviteLink = api.project.regenerateInviteLink.useMutation();

  useEffect(() => {
    if (projectDetails?.inviteToken) {
      setCurrentInviteToken(projectDetails.inviteToken);
    }
  }, [projectDetails]);

  const isLoading = creatorLoading || detailsLoading;
  if (!isCreator && !creatorLoading) return null;
  if (isLoading) return null;

  const tokenToUse = currentInviteToken || projectDetails?.inviteToken;

  const inviteLink = tokenToUse
    ? `${window.location.origin}/join/${projectId}/${tokenToUse}`
    : `${window.location.origin}/join/${projectId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard');
  };

  const handleRegenerateLink = async () => {
    if (!projectId) return;

    setIsRegenerating(true);
    try {
      const result = await regenerateInviteLink.mutateAsync({ projectId });
      if (result?.inviteToken) {
        setCurrentInviteToken(result.inviteToken);
      } else {
        console.error('No invite token returned from regeneration!');
      }

      toast.success('Invite link regenerated successfully');

      queryClient.invalidateQueries({ queryKey: ['project.getProjectById'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });

      await refetchProjectDetails();
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate invite link');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Invite Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the invite link? All previous links will be
              invalidated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                handleRegenerateLink();
              }}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Ask them to copy and paste this link</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="relative flex gap-2">
              <Input
                readOnly
                className="pr-28"
                type={!isRegenerating ? 'password' : 'text'}
                onClick={copyToClipboard}
                value={isRegenerating ? 'Generating...' : inviteLink}
                key={tokenToUse}
              />
              <Button
                className="absolute right-16 top-1 h-7 px-2"
                size="sm"
                onClick={copyToClipboard}
              >
                Copy
              </Button>
              <Button
                className="absolute right-1 top-1 h-7 px-2"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Join my project',
                        text: 'Join my project using this invite link:',
                        url: inviteLink,
                      });
                    } catch {
                      toast.error('Share failed');
                    }
                  } else {
                    toast.error('Not supported');
                  }
                }}
              >
                Share
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Any previous links will be invalidated when you regenerate
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmOpen(true)}
                disabled={isRegenerating}
                className="flex items-center gap-1"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Link'}
                {!isRegenerating && <RefreshCw className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button size="sm" onClick={() => setOpen(true)}>
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
