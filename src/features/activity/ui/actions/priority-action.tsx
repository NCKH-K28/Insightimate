'use client';

import React from 'react';
import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertCircle,
  Minus,
} from 'lucide-react';
import type { ActionRendererProps } from './types';

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

/**
 * Map priority label to an icon and color.
 */
function getPriorityVisual(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('urgent') || lower.includes('critical'))
    return { Icon: AlertCircle, color: 'text-red-500' };
  if (lower.includes('high'))
    return { Icon: SignalHigh, color: 'text-orange-500' };
  if (lower.includes('medium') || lower.includes('normal'))
    return { Icon: SignalMedium, color: 'text-amber-500' };
  if (lower.includes('low'))
    return { Icon: SignalLow, color: 'text-blue-500' };
  return { Icon: Minus, color: 'text-muted-foreground' };
}

export const PriorityAction: React.FC<ActionRendererProps> = ({ change }) => {
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    const { Icon, color } = getPriorityVisual(newVal);
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>set priority to</span>
        <Icon className={`size-3.5 ${color}`} />
        <span className='font-medium text-foreground'>{newVal}</span>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    const { Icon, color } = getPriorityVisual(oldVal);
    return (
      <div className='flex items-center gap-1.5'>
        <span className='text-muted-foreground'>removed priority</span>
        <Icon className={`size-3.5 ${color} opacity-50`} />
        <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      </div>
    );
  }

  const oldVisual = getPriorityVisual(oldVal);
  const newVisual = getPriorityVisual(newVal);

  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-muted-foreground'>changed priority from</span>
      <oldVisual.Icon className={`size-3.5 ${oldVisual.color} opacity-50`} />
      <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      <span className='text-muted-foreground'>to</span>
      <newVisual.Icon className={`size-3.5 ${newVisual.color}`} />
      <span className='font-medium text-foreground'>{newVal}</span>
    </div>
  );
};
