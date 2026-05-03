'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Plus, Play } from 'lucide-react';
import type { PokerBacklogStory } from '../../types';

type EstimationQueueProps = {
  stories: PokerBacklogStory[];
  estimatedTimeText?: string;
  estimatedProgress?: number;
  onStart: () => void;
  canStart: boolean;
};

export function EstimationQueue({
  stories,
  estimatedTimeText = '45 - 60 MINS',
  estimatedProgress = 35,
  onStart,
  canStart,
}: EstimationQueueProps) {
  return (
    <aside className='flex h-full w-80 shrink-0 flex-col border-l bg-background p-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold tracking-tight'>Estimation Queue</h2>
        <span className='rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground'>
          {stories.length} {stories.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <ul className='mt-4 flex-1 space-y-2 overflow-auto pr-1'>
        {stories.map((story, index) => (
          <li
            key={story.id}
            className='flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm'
          >
            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
              {index + 1}
            </span>
            <div className='min-w-0'>
              <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                {story.code}
              </p>
              <p className='line-clamp-2 text-sm font-semibold leading-tight text-foreground'>
                {story.title}
              </p>
            </div>
          </li>
        ))}

        {/* Empty state slot */}
        <li
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center',
          )}
        >
          <span className='flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground'>
            <Plus className='size-4' />
          </span>
          <p className='text-xs text-muted-foreground'>
            {stories.length === 0
              ? 'Select stories to add items to the queue'
              : 'Add more stories to the queue'}
          </p>
        </li>
      </ul>

      {/* Footer */}
      <div className='space-y-3 pt-4'>
        <div>
          <div className='flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            <span>Est. time</span>
            <span className='text-foreground'>{estimatedTimeText}</span>
          </div>
          <Progress value={estimatedProgress} className='mt-1.5 h-1.5' />
        </div>

        <Button
          type='button'
          onClick={onStart}
          disabled={!canStart}
          className='h-11 w-full text-base font-semibold'
        >
          Start Planning Poker
          <Play className='size-4' />
        </Button>
      </div>
    </aside>
  );
}
