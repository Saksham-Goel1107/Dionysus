'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import React from 'react';
import { toast } from 'sonner';

const InviteButton = () => {
  const { projectId } = useProject();
  const { data: isCreator, isLoading } = api.project.isProjectCreator.useQuery(
    { projectId },
    { enabled: !!projectId },
  );
  const [open, setOpen] = React.useState(false);

  // If not creator or still loading, don't render the button
  if (!isCreator && !isLoading) return null;
  if (isLoading) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Ask them to copy and paste this link</p>
          <Input
            readOnly
            className="mt-4"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${projectId}`);
              toast.success('copied to clipboard');
            }}
            value={`${window.location.origin}/join/${projectId}`}
          ></Input>
        </DialogContent>
      </Dialog>

      <Button size="sm" onClick={() => setOpen(true)}>
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
