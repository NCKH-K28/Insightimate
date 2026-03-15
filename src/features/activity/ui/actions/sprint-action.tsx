'use client';

import React from 'react';
import { LayoutList } from 'lucide-react';
import type { ActionRendererProps } from './types';

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

export const SprintAction: React.FC<ActionRendererProps> = ({ change }) => {
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>added to sprint</span>
        <LayoutList className='size-3.5 text-green-500' />
        <span className='font-medium text-foreground'>{newVal}</span>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>removed from sprint</span>
        <LayoutList className='size-3.5 text-slate-400' />
        <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>moved from sprint</span>
      <LayoutList className='size-3.5 text-slate-400' />
      <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      <span className='text-muted-foreground'>to</span>
      <LayoutList className='size-3.5 text-green-500' />
      <span className='font-medium text-foreground'>{newVal}</span>
    </div>
  );
};
