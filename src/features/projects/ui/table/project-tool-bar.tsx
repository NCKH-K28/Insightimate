'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/hooks/stores/project-store';
import { Trash2Icon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProjectToolbar() {
  const selectedIssues = useProjectStore((state) => state.selectedIssues);
  const clearSelectedIssues = useProjectStore((state) => state.clearSelectedIssues);

  const selectedCount = selectedIssues.size;
  if (selectedCount === 0) return null;
  return (
    <div
      className={cn('absolute z-20 bottom-6 left-0 right-0', 'flex items-center justify-between')}
    >
      <div
        className={cn(
          'max-w-3xl mx-auto flex gap-2 p-2',
          'rounded-lg shadow-lg',
          'bg-white border border-gray-200',
        )}
      >
        <Badge className='rounded-md'>
          {selectedCount}
          <span> selected</span>
        </Badge>

        <Button size='sm' variant='outline'>
          Change status
        </Button>

        <Button variant='destructive' size='sm'>
          <Trash2Icon className='w-4 h-4' />
          Delete
        </Button>
        {/* clear */}
        <Button variant='outline' size='sm' onClick={clearSelectedIssues}>
          <XIcon className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
