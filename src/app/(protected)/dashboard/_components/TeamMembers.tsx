'use client';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { Crown, X } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ProjectType = {
  id: string;
  creatorId?: string;
};

const TeamMembers = () => {
  const { projectId, project } = useProject() as { projectId: string; project: ProjectType };
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId });
  const { data: isCreator } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );
  const removeProjectMember = api.project.removeProjectMember.useMutation();
  const refetch = useRefetch();
  const users = members || [];

  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ id: string; email: string } | null>(null);

  const handleRemoveMember = (userId: string) => {
    removeProjectMember.mutate(
      { projectId, userId },
      {
        onSuccess: () => {
          toast.success('Member removed successfully');
          refetch();
          setDialogOpen(false);
          setUserToRemove(null);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to remove member');
          setDialogOpen(false);
        },
      },
    );
  };

  const openRemoveDialog = (userId: string, email: string) => {
    setUserToRemove({ id: userId, email });
    setDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {users?.map((member) => {
          const user = (member as any).user ?? member;
          return (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="group relative">
                  <a href={`mailto:${user.emailAddress}`}>
                    <div className="relative">
                      <Image
                        src={user.imageUrl || ''}
                        alt={user.firstName || ''}
                        height={30}
                        width={30}
                        className="rounded-full"
                      />
                      {user.isPro && (
                        <span
                          className="absolute -right-1 -top-2.5 text-yellow-400"
                          title="Premium User"
                        >
                          <Crown
                            className="h-4 w-4 text-yellow-400 drop-shadow md:h-5 md:w-5"
                            fill="#facc15"
                          />
                        </span>
                      )}
                      {isCreator && project?.creatorId !== user.id && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openRemoveDialog(user.id, user.emailAddress);
                          }}
                          className="absolute -right-1 -top-2 rounded-full bg-red-500 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                          title="Remove member"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  </a>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center" className="max-w-xs break-all">
                {user.emailAddress || 'No Email'}
                {project?.creatorId === user.id && ' (Creator)'}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Confirmation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {userToRemove?.email} from this project? They will
                lose access to all project resources.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={removeProjectMember.isPending}
                onClick={() => userToRemove && handleRemoveMember(userToRemove.id)}
              >
                {removeProjectMember.isPending ? 'Removing...' : 'Remove Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default TeamMembers;
