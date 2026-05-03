'use client';

import { cn } from '@/lib/utils';
import { POKER_DECKS, type PokerDeckType } from '../../types';

type DeckTypeSelectorProps = {
  value: PokerDeckType;
  onChange: (value: PokerDeckType) => void;
  disabled?: boolean;
};

export function DeckTypeSelector({ value, onChange, disabled }: DeckTypeSelectorProps) {
  return (
    <div className='grid grid-cols-3 gap-2'>
      {Object.values(POKER_DECKS).map((deck) => {
        const active = value === deck.id;
        return (
          <button
            key={deck.id}
            type='button'
            disabled={disabled}
            onClick={() => onChange(deck.id)}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center justify-center rounded-md border px-3 py-3 text-center transition',
              'hover:bg-accent/40',
              'disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background',
            )}
          >
            <span className='text-sm font-semibold text-foreground'>{deck.label}</span>
            <span className='mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
              {deck.subLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
