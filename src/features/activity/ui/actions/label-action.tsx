'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ActionRendererProps } from './types';

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

export const LabelAction: React.FC<ActionRendererProps> = ({ change }) => {
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>added label</span>
        <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
          {newVal}
        </Badge>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>removed label</span>
        <Badge variant='outline' className='text-[10px] px-1.5 py-0 opacity-60 line-through'>
          {oldVal}
        </Badge>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>changed label from</span>
      <Badge variant='outline' className='text-[10px] px-1.5 py-0 opacity-60 line-through'>
        {oldVal}
      </Badge>
      <span className='text-muted-foreground'>to</span>
      <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
        {newVal}
      </Badge>
    </div>
  );
};
