'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import type { PokerBacklogStory, PokerStoryPriority } from '../../types';

type BacklogStoryCardProps = {
  story: PokerBacklogStory;
  selected: boolean;
  onToggle: (storyId: string) => void;
};

const PRIORITY_STYLES: Record<PokerStoryPriority, string> = {
  HIGH: 'bg-rose-100 text-rose-700',
  MEDIUM: 'bg-emerald-100 text-emerald-700',
  LOW: 'bg-amber-100 text-amber-700',
  UNESTIMATED: 'bg-sky-100 text-sky-700',
};

const PRIORITY_LABEL: Record<PokerStoryPriority, string> = {
  HIGH: 'HIGH PRIORITY',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNESTIMATED: 'UNESTIMATED',
};

export function BacklogStoryCard({ story, selected, onToggle }: BacklogStoryCardProps) {
  return (
    <div
      className={cn(
        'group relative grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-lg border bg-card p-4 transition',
        'hover:border-primary/40',
        selected && 'border-primary shadow-sm ring-1 ring-primary/30',
      )}
    >
      {/* Selected indicator bar */}
      {selected && (
        <span
          aria-hidden
          className='absolute inset-y-2 left-0 w-1 rounded-r bg-primary'
        />
      )}

      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(story.id)}
        aria-label={`Select ${story.code}`}
        className='mt-1'
      />

      <div className='min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
            {story.code}
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              PRIORITY_STYLES[story.priority],
            )}
          >
            {PRIORITY_LABEL[story.priority]}
          </span>
        </div>
        <h3 className='mt-1 truncate text-base font-semibold text-foreground'>
          {story.title}
        </h3>
        {story.description && (
          <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
            {story.description}
          </p>
        )}
      </div>

      <div className='flex items-center gap-3'>
        {story.assignees && story.assignees.length > 0 && (
          <div className='flex -space-x-2'>
            {story.assignees.slice(0, 3).map((u) => (
              <Avatar key={u.id} className='size-6 border-2 border-background'>
                <AvatarImage src={u.avatarUrl} alt={u.name} />
                <AvatarFallback className='text-[9px]'>
                  {u.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        <button
          type='button'
          aria-label='More options'
          className='rounded p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
        >
          <MoreHorizontal className='size-4' />
        </button>
      </div>
    </div>
  );
}
