'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React from 'react';
import { CreateTeamForm } from '../forms/create-team-form';

type CreateTeamDialogProps = { params: { workspaceId: string } };
export const CreateTeamBtn = ({ params }: CreateTeamDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Create Team
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle></DialogTitle>
        <CreateTeamForm params={params} />
      </DialogContent>
    </Dialog>
  );
};
