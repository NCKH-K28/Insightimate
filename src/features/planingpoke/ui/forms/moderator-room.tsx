'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Eye,
  RotateCcw,
  Search,
  Settings,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  SessionSidebar,
  type PokerSidebarTab,
} from '../components';
import {
  POKER_DECKS,
  type PokerDeckType,
  type PokerHostCandidate,
  type PokerParticipant,
  type PokerVotingStory,
} from '../../types';

export type ModeratorParticipantView = PokerParticipant & {
  /** Vote value if revealed; otherwise hidden */
  revealedValue?: string;
};

type ModeratorRoomProps = {
  sessionName: string;
  host: PokerHostCandidate;
  story: PokerVotingStory & {
    description?: string;
    acceptanceCriteria?: string[];
  };
  deckType?: PokerDeckType;
  participants: ModeratorParticipantView[];
  /** Tổng seat (ví dụ 8) — dùng cho Votes Recorded x/y */
  totalSeats?: number;
  /** Đã reveal hay chưa */
  revealed?: boolean;
  /** Final points sau reveal */
  finalPoints?: number | null;
  /** Khi nào round bắt đầu (ms epoch) — dùng cho Time Elapsed */
  roundStartedAt?: number;
  /** Đang loading reveal/reset */
  busyReveal?: boolean;
  busyReset?: boolean;
  /** Moderator có vote bypass hay không (mặc định off) */
  moderatorEstimate?: string;
  /** Min/Max numeric vote (after reveal) */
  minVote?: number | null;
  maxVote?: number | null;
  /** Loading flags for save/revote */
  busySave?: boolean;
  /** Callbacks */
  onInvite?: () => void;
  onExit?: () => void;
  onReveal?: () => void;
  onReset?: () => void;
  onSaveAndNext?: (finalPoints: number) => void;
  onRevote?: () => void;
  onTabChange?: (tab: PokerSidebarTab) => void;
  /** Bypass vote — host pick a card */
  onModeratorVote?: (value: string) => void;
};

const fmtElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function ModeratorRoom({
  sessionName,
  host,
  story,
  deckType = 'FIBONACCI',
  participants,
  totalSeats,
  revealed = false,
  finalPoints,
  roundStartedAt,
  busyReveal,
  busyReset,
  busySave,
  moderatorEstimate,
  minVote,
  maxVote,
  onInvite,
  onExit,
  onReveal,
  onReset,
  onSaveAndNext,
  onRevote,
  onTabChange,
  onModeratorVote,
}: ModeratorRoomProps) {
  const [activeTab, setActiveTab] = React.useState<PokerSidebarTab>('voting');
  const handleTabChange = (t: PokerSidebarTab) => {
    setActiveTab(t);
    onTabChange?.(t);
  };

  // Editable final-points input (host can override average)
  const [finalInput, setFinalInput] = React.useState<string>('');
  React.useEffect(() => {
    if (revealed && finalPoints != null) setFinalInput(String(finalPoints));
  }, [revealed, finalPoints]);
  const [search, setSearch] = React.useState('');

  //  live elapsed
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = roundStartedAt ? now - roundStartedAt : 0;

  const total = totalSeats ?? participants.length;
  const votedCount = participants.filter((p) => p.status === 'READY').length;
  const progressPct = total > 0 ? Math.min(100, Math.round((votedCount / total) * 100)) : 0;

  const cards = POKER_DECKS[deckType].values;

  return (
    <div className='grid h-screen grid-cols-[16rem_1fr] bg-background'>
      <SessionSidebar
        sessionName={sessionName}
        host={host}
        active={activeTab}
        onTabChange={handleTabChange}
        onInvite={onInvite}
        onExit={onExit}
      />

      <main className='relative flex min-w-0 flex-col overflow-hidden bg-[#F7F8FC]'>
        {/* Top bar */}
        <header className='flex items-center justify-between gap-4 border-b bg-background px-6 py-3'>
          <nav className='flex items-center gap-6 text-sm'>
            <button className='pb-2 font-medium text-muted-foreground hover:text-foreground'>
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
          <div className='grid grid-cols-[1fr_22rem] gap-6'>
            {/* Story column */}
            <section>
              <p className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                <span className='size-2 rounded-full bg-blue-600' />
                <span className='uppercase tracking-wider'>Currently estimating: {story.code}</span>
              </p>
              <h1 className='mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-[2rem]'>
                {story.title}
              </h1>

              <div className='mt-6 rounded-xl border bg-background p-6 shadow-sm'>
                <h3 className='text-base font-bold tracking-tight'>Description</h3>
                {story.description ? (
                  <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
                    {story.description}
                  </p>
                ) : (
                  <p className='mt-3 text-sm italic text-muted-foreground'>
                    No description provided.
                  </p>
                )}

                {!!story.acceptanceCriteria?.length && (
                  <>
                    <h3 className='mt-6 text-base font-bold tracking-tight'>Acceptance Criteria</h3>
                    <ul className='mt-3 space-y-2 text-sm text-muted-foreground'>
                      {story.acceptanceCriteria.map((ac, i) => (
                        <li key={i} className='flex items-start gap-2'>
                          <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                          <span className='leading-relaxed'>{ac}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            {/* Moderator desk */}
            <aside className='rounded-xl border bg-background p-5 shadow-sm'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base font-bold tracking-tight'>Moderator Desk</h3>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                    revealed
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-emerald-100 text-emerald-700',
                  )}
                >
                  {revealed ? 'Revealed' : 'Active Round'}
                </span>
              </div>

              {/* Votes recorded */}
              <div className='mt-5 rounded-lg bg-muted/40 p-4'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                  Votes Recorded
                </p>
                <p className='mt-1 text-2xl font-extrabold tracking-tight'>
                  {votedCount} / {total}
                </p>
                <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all'
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Buttons */}
              {!revealed && (
                <>
                  <Button
                    className='mt-4 h-11 w-full text-sm font-semibold'
                    onClick={onReveal}
                    disabled={!!busyReveal || votedCount === 0}
                  >
                    <Eye className='mr-2 size-4' />
                    Reveal Cards
                  </Button>
                  <Button
                    variant='outline'
                    className='mt-2 h-11 w-full text-sm font-semibold'
                    onClick={onReset}
                    disabled={!!busyReset}
                  >
                    <RotateCcw className='mr-2 size-4' />
                    Reset Round
                  </Button>
                </>
              )}

              {revealed && (
                <div className='mt-4 space-y-3'>
                  {/* Statistics */}
                  <div className='rounded-lg border bg-muted/30 p-3'>
                    <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                      Statistics
                    </p>
                    <div className='mt-2 grid grid-cols-3 gap-2 text-center'>
                      <div>
                        <p className='text-[10px] font-medium text-muted-foreground'>Average</p>
                        <p className='mt-0.5 text-lg font-extrabold text-emerald-600'>
                          {finalPoints != null ? finalPoints : '—'}
                        </p>
                      </div>
                      <div>
                        <p className='text-[10px] font-medium text-muted-foreground'>Min</p>
                        <p className='mt-0.5 text-lg font-extrabold'>{minVote ?? '—'}</p>
                      </div>
                      <div>
                        <p className='text-[10px] font-medium text-muted-foreground'>Max</p>
                        <p className='mt-0.5 text-lg font-extrabold'>{maxVote ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Final Estimate */}
                  <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
                    <div className='flex items-center gap-2'>
                      <Sparkles className='size-4 text-blue-600' />
                      <p className='text-[10px] font-semibold uppercase tracking-wider text-blue-700'>
                        Final Estimate
                      </p>
                    </div>
                    <Input
                      type='number'
                      step='0.5'
                      value={finalInput}
                      onChange={(e) => setFinalInput(e.target.value)}
                      className='mt-2 h-12 bg-background text-center text-2xl font-extrabold'
                    />
                    <Button
                      className='mt-3 h-10 w-full text-sm font-semibold'
                      onClick={() => {
                        const n = Number(finalInput);
                        if (Number.isFinite(n)) onSaveAndNext?.(n);
                      }}
                      disabled={!!busySave || finalInput === ''}
                    >
                      Save &amp; Next
                      <ArrowRight className='ml-2 size-4' />
                    </Button>
                    <Button
                      variant='outline'
                      className='mt-2 h-10 w-full text-sm font-semibold'
                      onClick={onRevote}
                      disabled={!!busyReset}
                    >
                      <RotateCcw className='mr-2 size-4' />
                      Revote
                    </Button>
                  </div>
                </div>
              )}

              <div className='mt-4 flex items-center justify-between text-xs text-muted-foreground'>
                <span>Time Elapsed: {fmtElapsed(elapsed)}</span>
                <div className='flex items-center gap-1'>
                  <span className='size-1.5 rounded-full bg-blue-600' />
                  <span className='size-1.5 rounded-full bg-muted-foreground/40' />
                  <span className='size-1.5 rounded-full bg-muted-foreground/40' />
                </div>
              </div>
            </aside>
          </div>

          {/* Participants grid */}
          <section className='mt-10'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-bold tracking-tight'>Participants</h2>
              <span className='text-xs font-medium text-muted-foreground'>
                {participants.length} Members Online
              </span>
            </div>

            <div className='mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
              {participants.map((p) => {
                const isThinking = p.status === 'THINKING' || p.status === 'IDLE';
                const isVoted = p.status === 'READY';
                return (
                  <div key={p.id} className='flex flex-col items-center'>
                    <ParticipantCard
                      thinking={isThinking}
                      voted={isVoted}
                      revealed={revealed}
                      revealedValue={p.revealedValue}
                    />
                    <div className='mt-3 flex flex-col items-center gap-0.5'>
                      <div className='flex items-center gap-2'>
                        <Avatar className='size-5'>
                          <AvatarImage src={p.avatarUrl} alt={p.name} />
                          <AvatarFallback className='text-[9px]'>
                            {p.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-xs font-semibold'>{p.name}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          isVoted ? 'text-emerald-600' : 'text-amber-600',
                        )}
                      >
                        {isVoted ? 'Voted' : 'Thinking'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Floating bottom: Consensus strip when revealed, Bypass cards otherwise */}
        <div className='pointer-events-none absolute inset-x-0 bottom-6 flex justify-center'>
          {revealed ? (
            <div className='pointer-events-auto flex items-center gap-3 rounded-2xl border bg-background px-5 py-3 shadow-lg'>
              <div className='flex items-center gap-2 pr-2'>
                <CheckCircle2 className='size-5 text-emerald-500' />
                <span className='text-sm font-bold tracking-tight'>Consensus Reached</span>
              </div>
              {cards.map((v) => {
                const wasVoted = participants.some((p) => p.revealedValue === v);
                return (
                  <span
                    key={v}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold transition',
                      wasVoted
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-border bg-muted/40 text-muted-foreground',
                    )}
                  >
                    {v}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className='pointer-events-auto flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 shadow-lg'>
              <div className='flex flex-col pr-3'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-primary'>
                  Your Estimate
                </span>
                <span className='text-[10px] font-medium text-muted-foreground'>
                  Moderator bypass enabled
                </span>
              </div>
              {cards.map((v) => {
                const active = v === moderatorEstimate;
                return (
                  <button
                    key={v}
                    type='button'
                    onClick={() => onModeratorVote?.(v)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border text-sm font-bold transition',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/40 hover:text-primary',
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ParticipantCard({
  thinking,
  voted,
  revealed,
  revealedValue,
}: {
  thinking: boolean;
  voted: boolean;
  revealed: boolean;
  revealedValue?: string;
}) {
  // Revealed → flip and show number (or '?' if no vote)
  if (revealed) {
    return (
      <div
        className={cn(
          'relative flex h-32 w-24 items-center justify-center rounded-xl border shadow-sm',
          revealedValue
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-dashed bg-muted/40 text-muted-foreground',
        )}
      >
        <span className='text-3xl font-extrabold'>{revealedValue ?? '—'}</span>
        {voted && (
          <span className='absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm'>
            <CheckCircle2 className='size-4' />
          </span>
        )}
      </div>
    );
  }

  // Voted but not revealed → face-down with "?"
  if (voted) {
    return (
      <div className='relative flex h-32 w-24 items-center justify-center rounded-xl border bg-background shadow-sm'>
        <span className='text-3xl font-extrabold text-muted-foreground/60'>?</span>
        <span className='absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm'>
          <CheckCircle2 className='size-4' />
        </span>
      </div>
    );
  }

  // Thinking
  return (
    <div className='flex h-32 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 text-muted-foreground'>
      <Hourglass className='size-7 text-amber-500' />
      <span className='mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600'>
        Thinking
      </span>
    </div>
  );
}
