'use client';

import { Bot, BookmarkCheck, Target } from 'lucide-react';
import type { PokerVotingStory } from '../../types';

type VotingStoryHeaderProps = {
  story: PokerVotingStory;
};

export function VotingStoryHeader({ story }: VotingStoryHeaderProps) {
  return (
    <div>
      <span className='inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary'>
        {story.code}
      </span>
      <h1 className='mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl'>
        {story.title}
      </h1>

      {/* Description card */}
      <div className='relative mt-5 overflow-hidden rounded-lg border bg-primary/5 p-5'>
        <Bot
          aria-hidden
          className='pointer-events-none absolute right-4 top-1/2 size-16 -translate-y-1/2 text-primary/20'
        />
        {story.description && (
          <p className='max-w-xl text-sm leading-relaxed text-muted-foreground'>
            {story.description}
          </p>
        )}
        <div className='mt-4 flex flex-wrap items-center gap-2'>
          {story.source && (
            <span className='inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm'>
              <BookmarkCheck className='size-3.5 text-primary' />
              {story.source}
            </span>
          )}
          {story.pointTarget !== undefined && (
            <span className='inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm'>
              <Target className='size-3.5 text-primary' />
              {story.pointTarget} Point Target
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
