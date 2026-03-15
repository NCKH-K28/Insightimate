'use client';

import React from 'react';
import type { ActionRendererProps } from './types';

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

/**
 * Map status category to a semantic dot color.
 */
function statusDotColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('done') || lower.includes('complete') || lower.includes('closed'))
    return 'bg-emerald-500';
  if (lower.includes('progress') || lower.includes('active') || lower.includes('review'))
    return 'bg-blue-500';
  if (lower.includes('todo') || lower.includes('open') || lower.includes('new'))
    return 'bg-slate-400';
  return 'bg-teal-500';
}

export const StatusAction: React.FC<ActionRendererProps> = ({ change }) => {
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>set status to</span>
        <span className={`size-2 rounded-full ${statusDotColor(newVal)} shrink-0`} />
        <span className='font-medium text-foreground'>{newVal}</span>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>removed status</span>
        <span className={`size-2 rounded-full ${statusDotColor(oldVal)} shrink-0 opacity-50`} />
        <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>changed status from</span>
      <span className={`size-2 rounded-full ${statusDotColor(oldVal)} shrink-0 opacity-50`} />
      <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      <span className='text-muted-foreground'>to</span>
      <span className={`size-2 rounded-full ${statusDotColor(newVal)} shrink-0`} />
      <span className='font-medium text-foreground'>{newVal}</span>
    </div>
  );
};
