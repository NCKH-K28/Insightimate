'use client';

import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UpdateSprintButton } from '../buttons/update-sprint-btn';
import { UpdateFormData } from '../forms/update-sprint-form';

type SprintActionsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  params: { boardId: string; sprintId: string };
  defaultValues?: Partial<UpdateFormData>;
};
export const SprintActions = ({ onDelete, params, defaultValues }: SprintActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <UpdateSprintButton params={params} defaultValues={defaultValues} />

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Sprint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
