'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  Settings,
  LayoutDashboard,
  Share2,
  Download,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionSidebar, type PokerSidebarTab } from '../components';
import type { PokerHostCandidate } from '../../types';

export type SummaryStoryRow = {
  id: string;
  code?: string | null;
  title: string;
  epic?: string | null;
  finalPoints: number | null;
  status: 'PENDING' | 'VOTING' | 'ESTIMATED' | 'SKIPPED' | string;
  voterAvatarUrls?: string[];
};

export type SummaryParticipantAvatar = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type SummaryPageProps = {
  sessionName: string;
  host: PokerHostCandidate;
  stories: SummaryStoryRow[];
  participants: SummaryParticipantAvatar[];
  /** % change vs last sprint, e.g. 12 means "+12%" */
  velocityChangePct?: number | null;
  isComplete?: boolean;
  busyComplete?: boolean;
  onBackToDashboard?: () => void;
  onShareReport?: () => void;
  onExportJira?: () => void;
  onCompleteSession?: () => void;
  onTabChange?: (tab: PokerSidebarTab) => void;
  onInvite?: () => void;
  onExit?: () => void;
};

const statusPill = (s: SummaryStoryRow['status']) => {
  switch (s) {
    case 'ESTIMATED':
      return { label: 'FINALIZED', cls: 'bg-emerald-100 text-emerald-700' };
    case 'SKIPPED':
      return { label: 'SKIPPED', cls: 'bg-zinc-200 text-zinc-700' };
    case 'VOTING':
      return { label: 'VOTING', cls: 'bg-amber-100 text-amber-700' };
    default:
      return { label: 'PENDING', cls: 'bg-zinc-100 text-zinc-600' };
  }
};

export function SummaryPage({
  sessionName,
  host,
  stories,
  participants,
  velocityChangePct,
  isComplete,
  busyComplete,
  onBackToDashboard,
  onShareReport,
  onExportJira,
  onCompleteSession,
  onTabChange,
  onInvite,
  onExit,
}: SummaryPageProps) {
  const [activeTab, setActiveTab] = React.useState<PokerSidebarTab>('summary');
  const handleTabChange = (t: PokerSidebarTab) => {
    setActiveTab(t);
    onTabChange?.(t);
  };

  const estimated = stories.filter((s) => s.status === 'ESTIMATED' && s.finalPoints != null);
  const totalPoints = estimated.reduce((sum, s) => sum + (s.finalPoints ?? 0), 0);
  const storyCount = stories.length;
  const avgVelocity =
    estimated.length > 0 ? Math.round((totalPoints / estimated.length) * 100) / 100 : 0;

  // Mini bar chart heights (deterministic: based on per-story points, fallback ramp)
  const bars = React.useMemo(() => {
    const points = estimated.map((s) => s.finalPoints ?? 0);
    const max = Math.max(1, ...points);
    if (points.length === 0) return [20, 35, 28, 50, 42, 65, 58, 80];
    return points.slice(0, 8).map((p) => Math.max(15, Math.round((p / max) * 100)));
  }, [estimated]);

  const showAvatars = participants.slice(0, 3);
  const extraAvatars = Math.max(0, participants.length - showAvatars.length);

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

      <main className='flex min-w-0 flex-col overflow-hidden bg-[#F7F8FC]'>
        {/* Top bar */}
        <header className='flex items-center justify-between gap-4 border-b bg-background px-6 py-3'>
          <nav className='flex items-center gap-6 text-sm'>
            <button className='pb-2 font-medium text-muted-foreground hover:text-foreground'>
              Dashboard
            </button>
            <button className='pb-2 font-medium text-primary border-b-2 border-primary -mb-[13px]'>
              History
            </button>
          </nav>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search sessions...'
                className='h-9 w-64 rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary'
              />
            </div>
            <button className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'>
              <Bell className='size-4' />
            </button>
            <button className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'>
              <Settings className='size-4' />
            </button>
            <Avatar className='size-8'>
              <AvatarImage src={host.avatarUrl} alt={host.name} />
              <AvatarFallback>{host.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-6'>
          <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 pb-28'>
            {/* Hero */}
            <section className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg'>
              <div className='flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between'>
                <div className='max-w-xl'>
                  <h1 className='text-3xl font-extrabold tracking-tight'>Congratulations!</h1>
                  <p className='mt-2 text-sm leading-relaxed text-white/85'>
                    You&apos;ve successfully estimated the entire sprint backlog.
                    <br />
                    Your team is ready to execute with confidence.
                  </p>
                  <div className='mt-5 flex flex-wrap gap-3'>
                    <Button
                      type='button'
                      onClick={onBackToDashboard}
                      className='h-10 gap-2 bg-emerald-500 text-white hover:bg-emerald-600'
                    >
                      <LayoutDashboard className='size-4' />
                      Back to Dashboard
                    </Button>
                    <Button
                      type='button'
                      onClick={onShareReport}
                      variant='secondary'
                      className='h-10 gap-2 bg-white/15 text-white backdrop-blur hover:bg-white/25'
                    >
                      <Share2 className='size-4' />
                      Share Report
                    </Button>
                  </div>
                </div>

                {/* Decorative cards */}
                <div className='relative flex h-32 w-44 shrink-0'>
                  <div className='absolute left-0 top-2 flex h-28 w-20 -rotate-6 items-center justify-center rounded-xl bg-white text-2xl font-extrabold text-blue-600 shadow-xl'>
                    {estimated[0]?.finalPoints ?? 8}
                  </div>
                  <div className='absolute right-0 top-0 flex h-28 w-20 rotate-6 items-center justify-center rounded-xl bg-emerald-300 text-2xl font-extrabold text-emerald-900 shadow-xl'>
                    {totalPoints || 42}
                  </div>
                </div>
              </div>
            </section>

            {/* Stat cards */}
            <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              {/* Total Output */}
              <div className='rounded-xl border bg-background p-5 shadow-sm'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  Total Output
                </p>
                <p className='mt-2 text-2xl font-extrabold tracking-tight'>
                  {totalPoints} <span className='text-base font-semibold'>Story Points</span>
                </p>
                <div className='mt-3 flex items-end gap-1.5'>
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className='w-3 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400'
                      style={{ height: `${Math.max(12, (h / 100) * 48)}px` }}
                    />
                  ))}
                  {velocityChangePct != null ? (
                    <span className='ml-2 text-xs text-emerald-600'>
                      {velocityChangePct >= 0 ? '+' : ''}
                      {velocityChangePct}% vs last sprint
                    </span>
                  ) : null}
                </div>
              </div>

              {/* User stories */}
              <div className='rounded-xl border bg-background p-5 shadow-sm'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  User Stories
                </p>
                <p className='mt-2 text-2xl font-extrabold tracking-tight'>{storyCount}</p>
                <div className='mt-3 flex items-center'>
                  <div className='flex -space-x-2'>
                    {showAvatars.map((p) => (
                      <Avatar key={p.id} className='size-7 border-2 border-background'>
                        <AvatarImage src={p.avatarUrl} alt={p.name} />
                        <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {extraAvatars > 0 ? (
                    <span className='ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700'>
                      +{extraAvatars}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Avg velocity */}
              <div className='rounded-xl border bg-blue-50 p-5 shadow-sm'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  Avg. Velocity
                </p>
                <p className='mt-2 text-3xl font-extrabold tracking-tight text-blue-700'>
                  {avgVelocity}
                </p>
                <p className='mt-1 text-xs text-blue-600/80'>Points per story</p>
              </div>
            </section>

            {/* Agreed Estimates */}
            <section className='rounded-xl border bg-background shadow-sm'>
              <div className='flex items-center justify-between border-b px-5 py-4'>
                <div>
                  <h2 className='text-lg font-bold'>Agreed Estimates</h2>
                  <p className='text-xs text-muted-foreground'>
                    Final breakdown of the session&apos;s consensus
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    className='rounded-md border p-2 text-muted-foreground hover:bg-accent/40'
                    title='Filter'
                  >
                    <Filter className='size-4' />
                  </button>
                  <button
                    type='button'
                    className='rounded-md border p-2 text-muted-foreground hover:bg-accent/40'
                    title='Export'
                  >
                    <Download className='size-4' />
                  </button>
                </div>
              </div>

              {/* Header row */}
              <div className='grid grid-cols-[80px_1fr_120px_120px] gap-4 border-b bg-muted/30 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                <div>ID</div>
                <div>User Story Description</div>
                <div className='text-center'>Estimation</div>
                <div className='text-right'>Status</div>
              </div>

              {/* Rows */}
              <ul className='divide-y'>
                {stories.length === 0 ? (
                  <li className='px-5 py-10 text-center text-sm text-muted-foreground'>
                    No stories in this session yet.
                  </li>
                ) : (
                  stories.map((s) => {
                    const pill = statusPill(s.status);
                    return (
                      <li
                        key={s.id}
                        className='grid grid-cols-[80px_1fr_120px_120px] items-center gap-4 px-5 py-4'
                      >
                        <div className='font-mono text-sm font-semibold text-blue-600'>
                          {s.code ?? s.id.slice(0, 6)}
                        </div>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-semibold'>{s.title}</p>
                          {s.epic ? (
                            <p className='truncate text-xs text-muted-foreground'>
                              Epic: {s.epic}
                            </p>
                          ) : null}
                        </div>
                        <div className='flex justify-center'>
                          <span className='inline-flex h-8 min-w-12 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700'>
                            {s.finalPoints ?? '—'}
                          </span>
                        </div>
                        <div className='flex justify-end'>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                              pill.cls,
                            )}
                          >
                            {pill.label}
                          </span>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          </div>
        </div>

        {/* Floating bottom action bar */}
        <div className='pointer-events-none absolute inset-x-0 bottom-6 flex justify-center'>
          <div className='pointer-events-auto flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 shadow-2xl'>
            <span className='inline-flex items-center gap-1.5 text-sm font-semibold'>
              <CheckCircle2 className='size-4 text-emerald-600' />
              {isComplete ? 'Session Complete' : 'Ready to Complete'}
            </span>
            <span className='h-5 w-px bg-border' />
            <Button
              type='button'
              variant='ghost'
              onClick={onExportJira}
              className='h-8 px-3 text-sm'
            >
              Export to Jira
            </Button>
            {!isComplete && onCompleteSession ? (
              <Button
                type='button'
                onClick={onCompleteSession}
                disabled={busyComplete}
                className='h-8 bg-emerald-600 px-3 text-sm text-white hover:bg-emerald-700'
              >
                Complete Session
              </Button>
            ) : null}
            <Button
              type='button'
              onClick={onBackToDashboard}
              className='h-8 bg-blue-600 px-3 text-sm text-white hover:bg-blue-700'
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
