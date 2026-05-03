'use client';

import { cn } from '@/lib/utils';
import { POKER_BACKLOG_FILTERS, type PokerBacklogFilter } from '../../types';

type BacklogFilterChipsProps = {
  value: PokerBacklogFilter;
  onChange: (value: PokerBacklogFilter) => void;
};

export function BacklogFilterChips({ value, onChange }: BacklogFilterChipsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {POKER_BACKLOG_FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type='button'
            onClick={() => onChange(f.id)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
