'use client';

import { createTeamMutationOptions } from '@/features/teams/api/actionts';
import { listWsMembersQueryOptions } from '@/features/workspaces/api/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
