'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import useProject from '@/hooks/use-project';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, Loader2, RefreshCw, Share2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
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
  } = api.project.getProjectById.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data
    },
  );

  const regenerateInviteLink = api.project.regenerateInviteLink.useMutation();

  const toggleInvitationEnabled = api.project.toggleInvitationEnabled.useMutation();

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

  const handleToggleInvitation = async () => {
    if (!projectId) return;

    setIsToggling(true);
    try {
      const result = await toggleInvitationEnabled.mutateAsync({ projectId });
      toast.success(
        `Invitations ${result.invitationEnabled ? 'enabled' : 'disabled'} successfully`,
      );

      queryClient.invalidateQueries({ queryKey: ['project.getProjectById'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });

      await refetchProjectDetails();
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle invitations');
    } finally {
      setIsToggling(false);
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
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-xl">Invite Team Members</DialogTitle>
            </div>
            <DialogDescription>
              Share your project with team members by enabling invitations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Loading State */}
            {detailsLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <>
                {/* Toggle Switch */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Enable Invitations</p>
                        <p className="text-xs text-muted-foreground">
                          Allow others to join this project
                        </p>
                      </div>
                      <Switch
                        checked={projectDetails?.invitationEnabled ?? false}
                        onCheckedChange={handleToggleInvitation}
                        disabled={isToggling}
                      />
                    </div>
                    {isToggling && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating settings...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invite Link Section */}
                {projectDetails?.invitationEnabled ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Invitation Link</p>
                      <p className="text-xs text-muted-foreground">
                        Share this link with team members to invite them
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          readOnly
                          className="pr-20 font-mono text-xs"
                          type={showInviteLink ? 'text' : 'password'}
                          value={isRegenerating ? 'Generating new link...' : inviteLink}
                          disabled={isRegenerating}
                        />
                        <div className="absolute right-1 top-1 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowInviteLink(!showInviteLink)}
                            disabled={isRegenerating}
                          >
                            {showInviteLink ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={copyToClipboard}
                            disabled={isRegenerating}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                          disabled={isRegenerating}
                          className="flex-1"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
                              toast.error('Share not supported on this device');
                            }
                          }}
                          disabled={isRegenerating}
                          className="flex-1"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Security</p>
                        <p className="text-xs text-muted-foreground">
                          Regenerate to invalidate old links
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmOpen(true)}
                        disabled={isRegenerating}
                        className="flex items-center gap-2"
                      >
                        {isRegenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="mb-1 text-sm font-medium">Invitations Disabled</p>
                      <p className="text-xs text-muted-foreground">
                        Enable invitations above to start inviting team members
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
          // Force refresh data when modal opens
          refetchProjectDetails();
        }}
      >
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
