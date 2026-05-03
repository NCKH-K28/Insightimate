'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Bell, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  ParticipantsPanel,
  SessionSidebar,
  VoteActionBar,
  VotingHand,
  VotingStoryHeader,
  type PokerSidebarTab,
} from '../components';
import {
  POKER_DECKS,
  type PokerDeckType,
  type PokerHostCandidate,
  type PokerParticipant,
  type PokerVotingStory,
} from '../../types';

type VotingRoomProps = {
  sessionName: string;
  host: PokerHostCandidate;
  story: PokerVotingStory;
  /** Loại deck đã chọn ở step 1 */
  deckType?: PokerDeckType;
  participants: PokerParticipant[];
  /** External controlled state (when wired to backend) */
  initialEstimate?: string;
  initialConfirmed?: boolean;
  onInvite?: () => void;
  onExit?: () => void;
  /** Pick / change card → submit unconfirmed vote to server */
  onSelectCard?: (estimate: string) => void | Promise<void>;
  /** Confirm vote on server */
  onConfirmVote?: (estimate: string) => void | Promise<void>;
  /** Clear vote on server */
  onClearVote?: () => void | Promise<void>;
  /** Legacy single callback (called once on confirm) — kept for back-compat */
  onSubmitVote?: (estimate: string) => void;
  onTabChange?: (tab: PokerSidebarTab) => void;
};

export function VotingRoom({
  sessionName,
  host,
  story,
  deckType = 'FIBONACCI',
  participants,
  initialEstimate,
  initialConfirmed,
  onInvite,
  onExit,
  onSelectCard,
  onConfirmVote,
  onClearVote,
  onSubmitVote,
  onTabChange,
}: VotingRoomProps) {
  const [activeTab, setActiveTab] = React.useState<PokerSidebarTab>('voting');
  const handleTabChange = (t: PokerSidebarTab) => {
    setActiveTab(t);
    onTabChange?.(t);
  };
  const [estimate, setEstimate] = React.useState<string | undefined>(initialEstimate);
  const [confirmed, setConfirmed] = React.useState(!!initialConfirmed);
  const [search, setSearch] = React.useState('');

  // Sync from props (server state)
  React.useEffect(() => {
    setEstimate(initialEstimate);
  }, [initialEstimate]);
  React.useEffect(() => {
    setConfirmed(!!initialConfirmed);
  }, [initialConfirmed]);

  const cards = POKER_DECKS[deckType].values;

  const handleSelect = (value: string) => {
    if (confirmed) return;
    setEstimate(value);
    void onSelectCard?.(value);
  };

  const handleClear = () => {
    setEstimate(undefined);
    setConfirmed(false);
    void onClearVote?.();
  };

  const handleEdit = () => {
    setConfirmed(false);
    toast.info('You can change your estimate now.');
  };

  const handleConfirm = () => {
    if (estimate === undefined) return;
    setConfirmed(true);
    if (onConfirmVote) {
      void onConfirmVote(estimate);
    } else {
      onSubmitVote?.(estimate);
    }
    toast.success(`Vote confirmed: ${estimate}`);
  };

  return (
    <div className='grid h-screen grid-cols-[16rem_1fr_18rem] bg-background'>
      <SessionSidebar
        sessionName={sessionName}
        host={host}
        active={activeTab}
        onTabChange={handleTabChange}
        onInvite={onInvite}
        onExit={onExit}
      />

      {/* Main */}
      <main className='relative flex min-w-0 flex-col overflow-hidden bg-[#F7F8FC]'>
        {/* Top bar (same pattern as backlog screen) */}
        <header className='flex items-center justify-between gap-4 border-b bg-background px-6 py-3'>
          <nav className='flex items-center gap-6 text-sm'>
            <button
              className={cn('border-b-2 pb-2 font-semibold border-primary text-primary')}
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
        <div className='flex-1 overflow-auto px-10 pb-32 pt-8'>
          <VotingStoryHeader story={story} />

          <div className='mt-10 flex items-center justify-between'>
            <h2 className='text-lg font-bold tracking-tight'>Your Hand</h2>
            <span className='inline-flex items-center gap-2 text-xs font-medium text-muted-foreground'>
              <span className='size-2 rounded-full bg-emerald-500' />
              Live Voting Session
            </span>
          </div>

          <div className='mt-4'>
            <VotingHand
              cards={cards}
              selected={estimate}
              locked={confirmed}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Floating action bar */}
        <div className='pointer-events-none absolute inset-x-0 bottom-6 flex justify-center'>
          <div className='pointer-events-auto'>
            <VoteActionBar
              estimate={estimate}
              confirmed={confirmed}
              onEdit={handleEdit}
              onClear={handleClear}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      </main>

      <ParticipantsPanel
        participants={participants}
        totalSeats={12}
        tip='If estimates are widely spread, consider breaking down the user story into smaller sub-tasks for better clarity.'
      />
    </div>
  );
}
