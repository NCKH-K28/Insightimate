'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Pencil, Trash2 } from 'lucide-react';

type VoteActionBarProps = {
  estimate?: string;
  /** Đã confirm hay chưa */
  confirmed: boolean;
  onEdit: () => void;
  onClear: () => void;
  onConfirm: () => void;
};

export function VoteActionBar({
  estimate,
  confirmed,
  onEdit,
  onClear,
  onConfirm,
}: VoteActionBarProps) {
  const hasEstimate = estimate !== undefined && estimate !== '';

  return (
    <div className='flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-md'>
      <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
        Your Estimate:
      </span>
      <span
        className={cn(
          'flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-bold',
          hasEstimate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {hasEstimate ? estimate : '—'}
      </span>

      <button
        type='button'
        onClick={onEdit}
        disabled={!hasEstimate || !confirmed}
        aria-label='Edit estimate'
        className={cn(
          'rounded-md p-1.5 text-muted-foreground transition',
          'hover:bg-accent/40 hover:text-foreground',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        )}
      >
        <Pencil className='size-4' />
      </button>

      <Button
        type='button'
        onClick={onConfirm}
        disabled={!hasEstimate || confirmed}
        size='sm'
        className='h-9 rounded-full px-4 text-xs font-semibold'
      >
        {confirmed ? <Check className='size-4' /> : null}
        {confirmed ? 'Voted' : 'Confirm Vote'}
      </Button>

      <button
        type='button'
        onClick={onClear}
        disabled={!hasEstimate}
        aria-label='Clear estimate'
        className={cn(
          'rounded-md p-1.5 text-muted-foreground transition',
          'hover:bg-rose-500/10 hover:text-rose-500',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
        )}
      >
        <Trash2 className='size-4' />
      </button>
    </div>
  );
}
