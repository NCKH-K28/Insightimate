'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  LayoutGrid,
  LogOut,
  Users,
  CheckSquare,
  LifeBuoy,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import type { PokerHostCandidate } from '../../types';

export type PokerSidebarTab = 'backlog' | 'voting' | 'participants' | 'summary';

type SessionSidebarProps = {
  sessionName: string;
  host: PokerHostCandidate;
  active: PokerSidebarTab;
  onTabChange?: (tab: PokerSidebarTab) => void;
  onInvite?: () => void;
  onExit?: () => void;
};

const NAV_ITEMS: { id: PokerSidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'backlog', label: 'Backlog', icon: ClipboardList },
  { id: 'voting', label: 'Voting Room', icon: LayoutGrid },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'summary', label: 'Summary', icon: CheckSquare },
];

export function SessionSidebar({
  sessionName,
  host,
  active,
  onTabChange,
  onInvite,
  onExit,
}: SessionSidebarProps) {
  return (
    <aside className='flex h-full w-64 shrink-0 flex-col border-r bg-background'>
      {/* Logo */}
      <div className='px-5 pt-5'>
        <Link href='/' className='text-lg font-extrabold tracking-tight text-primary'>
          Poker Architect
        </Link>
      </div>

      {/* Session card */}
      <div className='mx-3 mt-5 flex items-center gap-3 rounded-lg border bg-muted/30 p-3'>
        <Avatar className='size-10'>
          <AvatarImage src={host.avatarUrl} alt={host.name} />
          <AvatarFallback>{host.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold'>{sessionName}</p>
          <p className='truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Host: {host.name}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className='mt-4 flex-1 px-2'>
        <ul className='space-y-0.5'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <li key={item.id}>
                <button
                  type='button'
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium uppercase tracking-wide transition',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                  )}
                >
                  <Icon className='size-4' />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom area */}
      <div className='space-y-2 p-3'>
        <Button
          type='button'
          onClick={onInvite}
          className='h-11 w-full bg-emerald-400 text-emerald-950 hover:bg-emerald-500'
        >
          <UserPlus className='size-4' />
          Invite Players
        </Button>

        <button
          type='button'
          className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-accent/40'
        >
          <LifeBuoy className='size-4' />
          Support
        </button>
        <button
          type='button'
          onClick={onExit}
          className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10'
        >
          <LogOut className='size-4' />
          Exit Session
        </button>
      </div>
    </aside>
  );
}
