'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, UserCheck, UserPlus, Crown } from 'lucide-react';
import type { PokerHostCandidate, PokerHostMode } from '../../types';

type HostSelectorProps = {
  hostMode: PokerHostMode;
  onHostModeChange: (mode: PokerHostMode) => void;
  hostUserId?: string;
  onHostUserChange: (userId: string | undefined) => void;
  /** Người tạo session - mặc định là host khi mode = ME */
  creator: PokerHostCandidate;
  /** Danh sách thành viên team có thể chọn làm host */
  candidates: PokerHostCandidate[];
};

export function HostSelector({
  hostMode,
  onHostModeChange,
  hostUserId,
  onHostUserChange,
  creator,
  candidates,
}: HostSelectorProps) {
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates.slice(0, 5);
    return candidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [candidates, search]);

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-2'>
        <ModeButton
          active={hostMode === 'ME'}
          icon={<Crown className='size-4' />}
          label='Me (Creator)'
          onClick={() => {
            onHostModeChange('ME');
            onHostUserChange(undefined);
          }}
        />
        <ModeButton
          active={hostMode === 'ANOTHER'}
          icon={<UserPlus className='size-4' />}
          label='Another Member'
          onClick={() => onHostModeChange('ANOTHER')}
        />
      </div>

      {hostMode === 'ME' ? (
        <div className='flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2'>
          <Avatar className='size-8'>
            <AvatarImage src={creator.avatarUrl} alt={creator.name} />
            <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>{creator.name}</p>
            {creator.email && (
              <p className='truncate text-xs text-muted-foreground'>{creator.email}</p>
            )}
          </div>
          <span className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'>
            <UserCheck className='size-3' /> Host
          </span>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search team member by name or email…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-8'
            />
          </div>
          <div className='max-h-44 overflow-auto rounded-md border bg-background'>
            {filtered.length === 0 ? (
              <p className='px-3 py-4 text-center text-xs text-muted-foreground'>
                No member found.
              </p>
            ) : (
              <ul className='divide-y'>
                {filtered.map((m) => {
                  const selected = m.id === hostUserId;
                  return (
                    <li key={m.id}>
                      <button
                        type='button'
                        onClick={() => onHostUserChange(m.id)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2 text-left transition',
                          'hover:bg-accent/40',
                          selected && 'bg-primary/5',
                        )}
                      >
                        <Avatar className='size-7'>
                          <AvatarImage src={m.avatarUrl} alt={m.name} />
                          <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>{m.name}</p>
                          {m.email && (
                            <p className='truncate text-xs text-muted-foreground'>{m.email}</p>
                          )}
                        </div>
                        {selected && (
                          <UserCheck className='size-4 shrink-0 text-primary' aria-label='Selected' />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition',
        'hover:bg-accent/40',
        active
          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
          : 'border-border bg-background text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
