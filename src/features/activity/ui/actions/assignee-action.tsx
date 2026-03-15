'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ActionRendererProps } from './types';

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

export const AssigneeAction: React.FC<ActionRendererProps> = ({ change }) => {
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>assigned to</span>
        <Avatar className='size-4 inline-flex'>
          <AvatarFallback className='text-[8px] bg-violet-500/10 text-violet-600'>
            {getInitials(newVal)}
          </AvatarFallback>
        </Avatar>
        <span className='font-medium text-foreground'>{newVal}</span>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>unassigned</span>
        <Avatar className='size-4 inline-flex'>
          <AvatarFallback className='text-[8px] bg-slate-500/10 text-slate-500'>
            {getInitials(oldVal)}
          </AvatarFallback>
        </Avatar>
        <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>reassigned from</span>
      <Avatar className='size-4 inline-flex'>
        <AvatarFallback className='text-[8px] bg-slate-500/10 text-slate-500'>
          {getInitials(oldVal)}
        </AvatarFallback>
      </Avatar>
      <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      <span className='text-muted-foreground'>to</span>
      <Avatar className='size-4 inline-flex'>
        <AvatarFallback className='text-[8px] bg-violet-500/10 text-violet-600'>
          {getInitials(newVal)}
        </AvatarFallback>
      </Avatar>
      <span className='font-medium text-foreground'>{newVal}</span>
    </div>
  );
};
