'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';
import type { PokerParticipant, PokerVoteStatus } from '../../types';

type ParticipantsPanelProps = {
  participants: PokerParticipant[];
  /** Tổng số seat (hiển thị badge x/y) */
  totalSeats?: number;
  tip?: string;
};

const STATUS_LABEL: Record<PokerVoteStatus, string> = {
  READY: 'READY',
  THINKING: 'THINKING…',
  IDLE: 'IDLE',
};

const STATUS_STYLE: Record<PokerVoteStatus, string> = {
  READY: 'text-emerald-600',
  THINKING: 'text-amber-600',
  IDLE: 'text-muted-foreground',
};

export function ParticipantsPanel({
  participants,
  totalSeats,
  tip,
}: ParticipantsPanelProps) {
  const readyCount = participants.filter((p) => p.status === 'READY').length;

  return (
    <aside className='flex h-full w-72 shrink-0 flex-col border-l bg-background p-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-bold tracking-tight'>Participants</h2>
        <span className='rounded bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground'>
          {readyCount} / {totalSeats ?? participants.length}
        </span>
      </div>

      <ul className='mt-4 flex-1 space-y-3 overflow-auto pr-1'>
        {participants.map((p) => (
          <li
            key={p.id}
            className='flex items-center gap-3 rounded-md p-1 hover:bg-accent/30'
          >
            <Avatar className='size-9'>
              <AvatarImage src={p.avatarUrl} alt={p.name} />
              <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{p.name}</p>
              {p.role && (
                <p className='truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  {p.role}
                </p>
              )}
            </div>
            <span
              className={cn(
                'shrink-0 text-[10px] font-bold uppercase tracking-wider',
                STATUS_STYLE[p.status],
              )}
            >
              {STATUS_LABEL[p.status]}
            </span>
          </li>
        ))}
      </ul>

      {tip && (
        <div className='mt-4 rounded-lg border bg-primary/5 p-4 text-center'>
          <Lightbulb className='mx-auto size-5 text-primary' />
          <p className='mt-2 text-[10px] font-bold uppercase tracking-wider text-primary'>
            Architect&apos;s Tip
          </p>
          <p className='mt-1.5 text-xs leading-relaxed text-muted-foreground'>{tip}</p>
        </div>
      )}
    </aside>
  );
}
