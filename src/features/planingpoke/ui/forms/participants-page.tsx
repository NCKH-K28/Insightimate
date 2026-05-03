'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Search,
  Settings,
  UserPlus,
  Crown,
  Eye as EyeIcon,
  Vote,
  Copy,
  MoreHorizontal,
  Trash2,
  Mail,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  SessionSidebar,
  type PokerSidebarTab,
} from '../components';
import type { PokerHostCandidate } from '../../types';

export type ParticipantRow = {
  /** PokerSessionParticipant.id (psp_…) */
  participantId: string;
  /** User.id */
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  /** HOST | VOTER | OBSERVER */
  role: 'HOST' | 'VOTER' | 'OBSERVER';
  /** READY | THINKING | IDLE */
  status: 'READY' | 'THINKING' | 'IDLE';
  invitedAt?: string | null;
  acceptedAt?: string | null;
};

export type InviteCandidate = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type ParticipantsPageProps = {
  sessionName: string;
  host: PokerHostCandidate;
  shareUrl: string;
  participants: ParticipantRow[];
  candidates: InviteCandidate[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isHost?: boolean;
  busyInvite?: boolean;
  busyRole?: boolean;
  busyRemove?: boolean;
  onInviteCandidate?: (
    candidate: InviteCandidate,
    role: 'VOTER' | 'OBSERVER' | 'HOST',
  ) => void;
  onChangeRole?: (
    participantId: string,
    role: 'VOTER' | 'OBSERVER' | 'HOST',
  ) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onTabChange?: (tab: PokerSidebarTab) => void;
  onInvite?: () => void;
  onExit?: () => void;
};

const roleLabel = (r: ParticipantRow['role']) =>
  r === 'HOST' ? 'MODERATOR' : r === 'OBSERVER' ? 'SPECTATOR' : 'VOTER';

const roleColor = (r: ParticipantRow['role']) =>
  r === 'HOST'
    ? 'bg-violet-100 text-violet-700'
    : r === 'OBSERVER'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700';

const statusLabel = (s: ParticipantRow['status']) =>
  s === 'READY' ? 'READY' : s === 'THINKING' ? 'THINKING' : 'OBSERVING';

const statusColor = (s: ParticipantRow['status']) =>
  s === 'READY'
    ? 'text-emerald-600'
    : s === 'THINKING'
      ? 'text-amber-600'
      : 'text-muted-foreground';

const fmtAgo = (iso?: string | null) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function ParticipantsPage({
  sessionName,
  host,
  shareUrl,
  participants,
  candidates,
  searchQuery,
  onSearchQueryChange,
  isHost,
  busyInvite,
  busyRole,
  busyRemove,
  onInviteCandidate,
  onChangeRole,
  onRemoveParticipant,
  onTabChange,
  onInvite,
  onExit,
}: ParticipantsPageProps) {
  const [activeTab, setActiveTab] = React.useState<PokerSidebarTab>('participants');
  const handleTabChange = (t: PokerSidebarTab) => {
    setActiveTab(t);
    onTabChange?.(t);
  };

  const accepted = participants.filter((p) => p.acceptedAt || p.role === 'HOST');
  const pending = participants.filter((p) => !p.acceptedAt && p.invitedAt && p.role !== 'HOST');

  const onlineCount = accepted.length;
  const voters = accepted.filter((p) => p.role === 'VOTER').length;
  const moderators = accepted.filter((p) => p.role === 'HOST').length;
  const spectators = accepted.filter((p) => p.role === 'OBSERVER').length;

  const totalForBars = Math.max(1, accepted.length);
  const pct = (n: number) => Math.round((n / totalForBars) * 100);

  // hide candidates already accepted/invited
  const inviteSet = new Set(participants.map((p) => p.userId));
  const filteredCandidates = candidates.filter((c) => !inviteSet.has(c.id));

  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Session link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy link');
    }
  };

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
            <button className='pb-2 font-medium text-muted-foreground hover:text-foreground'>
              History
            </button>
          </nav>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            >
              <Bell className='size-4' />
            </button>
            <button
              type='button'
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
        <div className='flex-1 overflow-auto px-10 pb-16 pt-8'>
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight'>Participants</h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                Manage your workshop team and roles
              </p>
            </div>
            <span className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700'>
              <span className='size-2 rounded-full bg-emerald-500' />
              {onlineCount} Members Online
            </span>
          </div>

          <div className='grid grid-cols-[1fr_22rem] gap-6'>
            {/* Left column */}
            <section className='space-y-6'>
              {/* Hero invite */}
              <div className='rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-md'>
                <div className='flex items-start justify-between gap-6'>
                  <div className='max-w-xl'>
                    <p className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-100'>
                      <Sparkles className='size-3.5' />
                      Scale your session?
                    </p>
                    <h2 className='mt-2 text-xl font-extrabold leading-tight tracking-tight'>
                      Invite more architects to refine your backlog with collective intelligence.
                    </h2>
                  </div>
                  <Button
                    onClick={onInvite}
                    variant='secondary'
                    className='bg-white text-blue-700 hover:bg-blue-50'
                  >
                    <UserPlus className='mr-2 size-4' />
                    Invite Members
                  </Button>
                </div>
              </div>

              {/* Member table */}
              <div className='rounded-xl border bg-background shadow-sm'>
                <div className='flex items-center justify-between border-b px-5 py-4'>
                  <h3 className='text-base font-bold tracking-tight'>Team Members</h3>
                  <span className='text-xs text-muted-foreground'>
                    {accepted.length} active
                  </span>
                </div>
                <div className='divide-y'>
                  {accepted.length === 0 && (
                    <p className='px-5 py-10 text-center text-sm text-muted-foreground'>
                      No members yet. Invite teammates to start estimating.
                    </p>
                  )}
                  {accepted.map((p) => (
                    <MemberRow
                      key={p.participantId}
                      row={p}
                      isHost={!!isHost}
                      busy={!!busyRole || !!busyRemove}
                      onChangeRole={onChangeRole}
                      onRemove={onRemoveParticipant}
                    />
                  ))}
                </div>
              </div>

              {/* Pending invites */}
              <div className='rounded-xl border bg-background shadow-sm'>
                <div className='flex items-center justify-between border-b px-5 py-4'>
                  <h3 className='inline-flex items-center gap-2 text-base font-bold tracking-tight'>
                    <Mail className='size-4 text-muted-foreground' />
                    Pending Invites
                  </h3>
                  <span className='text-xs text-muted-foreground'>{pending.length}</span>
                </div>
                <div className='divide-y'>
                  {pending.length === 0 && (
                    <p className='px-5 py-6 text-center text-sm text-muted-foreground'>
                      No pending invites.
                    </p>
                  )}
                  {pending.map((p) => (
                    <div
                      key={p.participantId}
                      className='flex items-center justify-between px-5 py-3'
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='size-9'>
                          <AvatarImage src={p.avatarUrl} alt={p.name} />
                          <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-semibold'>{p.name}</p>
                          <p className='text-xs text-muted-foreground'>{p.email}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='text-xs font-medium text-amber-600'>
                            Waiting for response
                          </p>
                          <p className='text-[11px] text-muted-foreground'>
                            Sent {fmtAgo(p.invitedAt)}
                          </p>
                        </div>
                        {isHost && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-muted-foreground hover:text-destructive'
                            disabled={!!busyRemove}
                            onClick={() => onRemoveParticipant?.(p.participantId)}
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right column */}
            <aside className='space-y-6'>
              {/* Role breakdown */}
              <div className='rounded-xl border bg-background p-5 shadow-sm'>
                <h3 className='inline-flex items-center gap-2 text-base font-bold tracking-tight'>
                  <Users className='size-4 text-muted-foreground' />
                  Role Breakdown
                </h3>
                <div className='mt-4 space-y-4 text-sm'>
                  <RoleBar
                    label='Voters'
                    icon={<Vote className='size-3.5 text-blue-600' />}
                    count={voters}
                    pct={pct(voters)}
                    color='bg-blue-500'
                  />
                  <RoleBar
                    label='Moderators'
                    icon={<Crown className='size-3.5 text-violet-600' />}
                    count={moderators}
                    pct={pct(moderators)}
                    color='bg-violet-500'
                  />
                  <RoleBar
                    label='Spectators'
                    icon={<EyeIcon className='size-3.5 text-amber-600' />}
                    count={spectators}
                    pct={pct(spectators)}
                    color='bg-amber-500'
                  />
                </div>
              </div>

              {/* Share link + search */}
              <div className='rounded-xl border bg-background p-5 shadow-sm'>
                <h3 className='text-base font-bold tracking-tight'>Share Session Link</h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Find a member by name or email, or copy the invite link.
                </p>

                {isHost && (
                  <>
                    <div className='relative mt-3'>
                      <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        placeholder='Search by name or email…'
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className='h-9 pl-8'
                      />
                    </div>

                    {(searchQuery || filteredCandidates.length > 0) && (
                      <div className='mt-2 max-h-56 overflow-auto rounded-lg border'>
                        {filteredCandidates.length === 0 && (
                          <p className='px-3 py-4 text-center text-xs text-muted-foreground'>
                            No matches.
                          </p>
                        )}
                        {filteredCandidates.map((c) => (
                          <button
                            key={c.id}
                            type='button'
                            disabled={!!busyInvite}
                            onClick={() => onInviteCandidate?.(c, 'VOTER')}
                            className='flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent/40 disabled:opacity-60'
                          >
                            <div className='flex items-center gap-2'>
                              <Avatar className='size-7'>
                                <AvatarImage src={c.avatarUrl} alt={c.name} />
                                <AvatarFallback className='text-[10px]'>
                                  {c.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className='text-xs font-semibold'>{c.name}</p>
                                <p className='text-[10px] text-muted-foreground'>{c.email}</p>
                              </div>
                            </div>
                            <span className='inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600'>
                              <UserPlus className='size-3' />
                              Invite
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className='mt-4 flex items-center gap-2 rounded-lg border bg-muted/30 p-2'>
                  <Input
                    readOnly
                    value={shareUrl}
                    className='h-8 flex-1 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0'
                  />
                  <Button size='sm' variant='outline' onClick={handleCopy} className='h-8'>
                    {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
                    <span className='ml-1.5 text-xs'>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function RoleBar({
  label,
  icon,
  count,
  pct,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className='flex items-center justify-between text-xs'>
        <span className='inline-flex items-center gap-1.5 font-semibold'>
          {icon}
          {label}
        </span>
        <span className='font-bold tabular-nums text-muted-foreground'>{count}</span>
      </div>
      <div className='mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted'>
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MemberRow({
  row,
  isHost,
  busy,
  onChangeRole,
  onRemove,
}: {
  row: ParticipantRow;
  isHost: boolean;
  busy: boolean;
  onChangeRole?: (participantId: string, role: 'VOTER' | 'OBSERVER' | 'HOST') => void;
  onRemove?: (participantId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className='flex items-center justify-between px-5 py-3'>
      <div className='flex items-center gap-3'>
        <Avatar className='size-9'>
          <AvatarImage src={row.avatarUrl} alt={row.name} />
          <AvatarFallback>{row.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-semibold'>{row.name}</p>
          <p className='text-xs text-muted-foreground'>{row.email}</p>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
            roleColor(row.role),
          )}
        >
          {roleLabel(row.role)}
        </span>
        <span
          className={cn(
            'min-w-20 text-right text-[10px] font-bold uppercase tracking-wider',
            statusColor(row.status),
          )}
        >
          {statusLabel(row.status)}
        </span>

        {isHost && (
          <div className='relative'>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={() => setOpen((v) => !v)}
              disabled={busy}
            >
              <MoreHorizontal className='size-4' />
            </Button>
            {open && (
              <>
                <button
                  type='button'
                  className='fixed inset-0 z-10 cursor-default'
                  onClick={() => setOpen(false)}
                  aria-hidden
                />
                <div className='absolute right-0 top-9 z-20 w-44 rounded-lg border bg-popover p-1 text-sm shadow-md'>
                  <button
                    type='button'
                    className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent/50 disabled:opacity-50'
                    disabled={row.role === 'VOTER'}
                    onClick={() => {
                      onChangeRole?.(row.participantId, 'VOTER');
                      setOpen(false);
                    }}
                  >
                    <Vote className='size-3.5 text-blue-600' />
                    Make Voter
                  </button>
                  <button
                    type='button'
                    className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent/50 disabled:opacity-50'
                    disabled={row.role === 'HOST'}
                    onClick={() => {
                      onChangeRole?.(row.participantId, 'HOST');
                      setOpen(false);
                    }}
                  >
                    <Crown className='size-3.5 text-violet-600' />
                    Make Moderator
                  </button>
                  <button
                    type='button'
                    className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent/50 disabled:opacity-50'
                    disabled={row.role === 'OBSERVER'}
                    onClick={() => {
                      onChangeRole?.(row.participantId, 'OBSERVER');
                      setOpen(false);
                    }}
                  >
                    <EyeIcon className='size-3.5 text-amber-600' />
                    Make Spectator
                  </button>
                  <div className='my-1 h-px bg-border' />
                  <button
                    type='button'
                    className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive hover:bg-destructive/10'
                    onClick={() => {
                      onRemove?.(row.participantId);
                      setOpen(false);
                    }}
                  >
                    <Trash2 className='size-3.5' />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
