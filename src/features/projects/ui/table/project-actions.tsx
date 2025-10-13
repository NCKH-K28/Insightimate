'use client';

import React from 'react';
import { Divide, MoreHorizontal, Settings2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export type ProjectActionsProps = {
  projectId: string;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onInvite?: (projectId: string) => void;
  permissions?: {
    update?: boolean;
    delete?: boolean;
    invite?: boolean;
  };
};

export function ProjectActions({
  projectId,
  onEdit,
  onDelete,
  onInvite,
  permissions = { delete: false, invite: false, update: false },
}: ProjectActionsProps) {
  const handleEdit = React.useCallback(() => {
    if (onEdit) onEdit(projectId);
  }, [onEdit, projectId]);

  const handleDelete = React.useCallback(() => {
    if (onDelete) onDelete(projectId);
  }, [onDelete, projectId]);

  const handleInvite = React.useCallback(() => {
    if (onInvite) onInvite(projectId);
  }, [onInvite, projectId]);

  const isPermEmpty = React.useMemo(() => {
    const can = Object.values(permissions).filter((v) => v === true);
    return can.length === 0;
  }, [permissions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='ml-auto' disabled={isPermEmpty}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' hidden={isPermEmpty}>
        <DropdownMenuItem hidden={!permissions.invite}>
          <User className='mr-1 h-4 w-4' />
          Invite User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} hidden={!permissions.update}>
          <Settings2 className='mr-1 h-4 w-4' />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          hidden={!permissions.delete}
          onClick={handleDelete}
          className='text-red-600 hover:bg-red-100 focus:bg-red-100'
        >
          <Trash2 className='mr-1 h-4 w-4 text-red-600' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
