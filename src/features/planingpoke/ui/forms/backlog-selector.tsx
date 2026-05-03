'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import {
  BacklogFilterChips,
  BacklogStoryCard,
  EstimationQueue,
  SessionSidebar,
  type PokerSidebarTab,
} from '../components';
import type {
  PokerBacklogFilter,
  PokerBacklogStory,
  PokerHostCandidate,
} from '../../types';

type BacklogSelectorProps = {
  sessionName: string;
  host: PokerHostCandidate;
  stories: PokerBacklogStory[];
  /** ID các story đã được chọn từ trước (vd: vừa khởi tạo session) */
  initialSelectedIds?: string[];
  onStart?: (selectedStoryIds: string[]) => void;
  onInvite?: () => void;
  onExit?: () => void;
};

export function BacklogSelector({
  sessionName,
  host,
  stories,
  initialSelectedIds,
  onStart,
  onInvite,
  onExit,
}: BacklogSelectorProps) {
  const [filter, setFilter] = React.useState<PokerBacklogFilter>('ALL');
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<PokerSidebarTab>('backlog');
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(initialSelectedIds ?? []),
  );

  const filteredStories = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter((s) => {
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q);

      const matchFilter = (() => {
        switch (filter) {
          case 'ALL':
            return true;
          case 'HIGH_PRIORITY':
            return s.priority === 'HIGH';
          case 'UNESTIMATED':
            return s.priority === 'UNESTIMATED';
          case 'SPRINT_4':
            return s.tags?.includes('Sprint 4') ?? false;
          case 'ARCHITECTURE':
            return s.tags?.includes('Architecture') ?? false;
          default:
            return true;
        }
      })();

      return matchSearch && matchFilter;
    });
  }, [stories, search, filter]);

  const queue = React.useMemo(
    () => stories.filter((s) => selected.has(s.id)),
    [stories, selected],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className='grid h-screen grid-cols-[16rem_1fr_20rem] bg-background'>
      <SessionSidebar
        sessionName={sessionName}
        host={host}
        active={activeTab}
        onTabChange={setActiveTab}
        onInvite={onInvite}
        onExit={onExit}
      />

      {/* Main */}
      <main className='flex min-w-0 flex-col overflow-hidden bg-[#F7F8FC]'>
        {/* Top bar */}
        <header className='flex items-center justify-between gap-4 border-b bg-background px-6 py-3'>
          <nav className='flex items-center gap-6 text-sm'>
            <button
              className={cn(
                'border-b-2 pb-2 font-semibold',
                'border-primary text-primary',
              )}
            >
              Dashboard
            </button>
            <button className='pb-2 font-medium text-muted-foreground hover:text-foreground'>
              History
            </button>
          </nav>

          <div className='flex items-center gap-3'>
            <div className='relative w-72'>
              <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search sessions…'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='h-9 rounded-full bg-muted/40 pl-8'
              />
            </div>
            <button
              type='button'
              aria-label='Notifications'
              className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            >
              <Bell className='size-4' />
            </button>
            <button
              type='button'
              aria-label='Settings'
              className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            >
              <Settings className='size-4' />
            </button>
            <Avatar className='size-8'>
              <AvatarImage src={host.avatarUrl} alt={host.name} />
              <AvatarFallback>{host.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Body */}
        <div className='flex-1 overflow-auto px-8 py-6'>
          <div className='mx-auto max-w-3xl'>
            <h1 className='text-3xl font-extrabold tracking-tight'>Product Backlog</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Select items to include in the next estimation session.
            </p>

            <div className='mt-5'>
              <BacklogFilterChips value={filter} onChange={setFilter} />
            </div>

            <div className='mt-5 space-y-3'>
              {filteredStories.length === 0 ? (
                <div className='rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground'>
                  No stories match this filter.
                </div>
              ) : (
                filteredStories.map((story) => (
                  <BacklogStoryCard
                    key={story.id}
                    story={story}
                    selected={selected.has(story.id)}
                    onToggle={toggleSelect}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <EstimationQueue
        stories={queue}
        canStart={queue.length > 0}
        onStart={() => onStart?.(Array.from(selected))}
      />
    </div>
  );
}
