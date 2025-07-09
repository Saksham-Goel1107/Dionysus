'use client';

import { Button } from '@/components/ui/button';
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
import useProject from '@/hooks/use-project';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import React from 'react';
import { toast } from 'sonner';

const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();
  const { projectId } = useProject();
  const { data: isCreator, isLoading } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );
  const refetch = useRefetch();
  const handleDelete = () => {
    archiveProject.mutate(
      { projectId: projectId },
      {
        onSuccess: () => {
          toast.success('Project deleted successfully');
          refetch();
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete project');
        },
      },
    );
  };

  // Only render the button if the user is the creator
  if (!isCreator && !isLoading) return null;
  if (isLoading) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={archiveProject.isPending} size="sm" variant="destructive">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your project and remove all
            associated data including questions, meetings, and source code analysis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={archiveProject.isPending}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {archiveProject.isPending ? 'Deleting...' : 'Delete Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArchiveButton;
