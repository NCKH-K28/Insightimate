'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React from 'react';
import { CreateTeamForm } from '../forms/create-team-form';

type CreateTeamDialogProps = {
  params: { orgId: string };
  label?: string;
  renderLabel?: () => React.ReactNode;
};
export const CreateTeamBtn = ({
  params,
  label = 'Create Team',
  renderLabel,
}: CreateTeamDialogProps) => {
  const renderedLabel = renderLabel ? (
    renderLabel()
  ) : (
    <Button size='sm' variant='outline'>
      {label}
    </Button>
  );
  return (
    <Dialog>
      <DialogTrigger asChild>{renderedLabel}</DialogTrigger>

      <DialogContent>
        <DialogTitle></DialogTitle>
        <CreateTeamForm params={params} />
      </DialogContent>
    </Dialog>
  );
};
