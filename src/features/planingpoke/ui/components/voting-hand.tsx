'use client';

import { cn } from '@/lib/utils';

type VotingHandProps = {
  cards: string[];
  selected?: string;
  /** Khi đã confirm → khoá việc chọn lại */
  locked?: boolean;
  onSelect: (value: string) => void;
};

export function VotingHand({ cards, selected, locked, onSelect }: VotingHandProps) {
  return (
    <div className='flex flex-wrap items-end gap-3'>
      {cards.map((value) => {
        const active = value === selected;
        return (
          <button
            key={value}
            type='button'
            disabled={locked}
            onClick={() => onSelect(value)}
            aria-pressed={active}
            className={cn(
              'group relative flex h-32 w-20 shrink-0 items-end justify-center rounded-xl border bg-card p-3 shadow-sm transition',
              'hover:-translate-y-1 hover:shadow-md',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-primary',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute left-2 top-2 text-xs font-bold opacity-30',
                active ? 'text-primary-foreground' : 'text-primary',
              )}
            >
              {value}
            </span>
            <span className='text-3xl font-extrabold'>{value}</span>
          </button>
        );
      })}
    </div>
  );
}
