 

'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';

type Props = {
  onDelete?: () => Promise<any> | void;
  onDeleted?: () => void;
};

export default function MoreOptionsDropdown({ onDelete, onDeleted }: Props) {
  const handleDelete = async () => {
    if (!onDelete) return;
    const res = onDelete();
    if (res && typeof (res as any).then === 'function') {
      await toast.promise(res as Promise<any>, {
        loading: 'Deleting issue...',
        success: 'Issue deleted',
        error: (err: any) => `Error: ${err?.message || 'Failed to delete issue'}`,
      });
      onDeleted?.();
    } else {
      toast.success('Issue deleted');
      onDeleted?.();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='p-2 rounded-md border hover:bg-gray-50 text-gray-600'
          aria-label='More options'
        >
          <MoreHorizontal className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' sideOffset={4} className='w-56 max-h-80 overflow-y-auto'>
        <DropdownMenuItem>Log work</DropdownMenuItem>
        <DropdownMenuItem className='flex justify-between'>
          Open command palette <span className='text-xs text-gray-400'>Ctrl K</span>
        </DropdownMenuItem>
        <DropdownMenuItem>Add flag</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem>Clone</DropdownMenuItem>
        <DropdownMenuItem>Move</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
        <DropdownMenuItem className='text-red-600 hover:text-red-700' onSelect={handleDelete}>
          Delete
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem>Connect Slack channel</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem>Export as Excel</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem>Print</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
