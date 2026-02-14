'use client';

import React from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  UserPlus,
  UserMinus,
  ShieldCheck,
  MessageSquare,
  Clock,
  Play,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActivityEventWithActor, ActivityAction, ActivityEntity } from '@/contracts/activity';

// ==================== Maps ====================

const ACTION_CONFIG: Record<ActivityAction, { icon: LucideIcon; label: string; color: string }> = {
  CREATED: { icon: Plus, label: 'created', color: 'text-emerald-500' },
  UPDATED: { icon: Pencil, label: 'updated', color: 'text-blue-500' },
  DELETED: { icon: Trash2, label: 'deleted', color: 'text-red-500' },
  MOVED: { icon: ArrowRight, label: 'moved', color: 'text-amber-500' },
  ASSIGNED: { icon: UserPlus, label: 'assigned', color: 'text-violet-500' },
  UNASSIGNED: { icon: UserMinus, label: 'unassigned', color: 'text-slate-500' },
  COMMENTED: { icon: MessageSquare, label: 'commented on', color: 'text-sky-500' },
  LOGGED_TIME: { icon: Clock, label: 'logged time on', color: 'text-orange-500' },
  STATUS_CHANGED: { icon: ArrowRight, label: 'changed status of', color: 'text-teal-500' },
  SPRINT_STARTED: { icon: Play, label: 'started sprint', color: 'text-green-500' },
  SPRINT_CLOSED: { icon: CheckCircle2, label: 'completed sprint', color: 'text-emerald-600' },
  MEMBER_ADDED: { icon: UserPlus, label: 'added member to', color: 'text-indigo-500' },
  MEMBER_REMOVED: { icon: UserMinus, label: 'removed member from', color: 'text-rose-500' },
  ROLE_CHANGED: { icon: ShieldCheck, label: 'changed role in', color: 'text-purple-500' },
};

const ENTITY_LABEL: Record<ActivityEntity, string> = {
  PROJECT: 'project',
  ISSUE: 'issue',
  SPRINT: 'sprint',
  COMMENT: 'comment',
  TEAM: 'team',
  ORGANIZATION: 'organization',
};

// ==================== Helpers ====================

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ==================== Changes display ====================

function ChangesDetail({ changes }: { changes: any }) {
  if (!changes || !Array.isArray(changes) || changes.length === 0) return null;

  return (
    <div className='mt-1.5 ml-10 text-xs text-muted-foreground space-y-0.5'>
      {changes.slice(0, 3).map((change: any, i: number) => (
        <div key={i} className='flex items-center gap-1.5'>
          <span className='font-medium text-foreground/70'>{change.field}</span>
          {change.old && (
            <>
              <span className='line-through opacity-60'>{String(change.old).slice(0, 30)}</span>
              <ArrowRight className='size-3 text-muted-foreground/50' />
            </>
          )}
          {change.new && <span>{String(change.new).slice(0, 30)}</span>}
        </div>
      ))}
      {changes.length > 3 && (
        <span className='text-muted-foreground/60'>+{changes.length - 3} more changes</span>
      )}
    </div>
  );
}

// ==================== Component ====================

type Props = {
  event: ActivityEventWithActor;
  /** When true, show project badge context (useful in org-level feeds) */
  showProject?: boolean;
};

export const ActivityFeedItem: React.FC<Props> = ({ event, showProject = true }) => {
  const config = ACTION_CONFIG[event.action] ?? ACTION_CONFIG.UPDATED;
  const Icon = config.icon;
  const entityLabel = ENTITY_LABEL[event.entity] ?? event.entity.toLowerCase();

  const entityDisplay = event.entityTitle || event.entityKey || event.entityId;

  return (
    <div className='group relative flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-accent/40 transition-colors'>
      {/* Avatar */}
      <Avatar className='size-8 mt-0.5 ring-2 ring-background shrink-0'>
        <AvatarImage src={event.actor?.avatar ?? undefined} alt={event.actor?.name ?? 'User'} />
        <AvatarFallback className='text-[11px] font-semibold bg-muted'>
          {getInitials(event.actor?.name ?? event.actorName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        {/* Main line */}
        <p className='text-sm leading-relaxed'>
          <span className='font-semibold text-foreground'>
            {event.actor?.name ?? event.actorName ?? 'Someone'}
          </span>{' '}
          <span className='text-muted-foreground'>{config.label} </span>
          <span className='font-medium text-foreground'>{entityLabel}</span>
          {entityDisplay && (
            <>
              {' '}
              <span className='font-semibold text-primary hover:underline cursor-pointer'>
                {entityDisplay}
              </span>
            </>
          )}
          {showProject && event.entityKey && event.entity !== 'PROJECT' && (
            <>
              {' '}
              <span className='text-muted-foreground'>in</span>{' '}
              <Badge variant='outline' className='text-[10px] px-1.5 py-0 font-mono'>
                {event.entityKey.split('-')[0]}
              </Badge>
            </>
          )}
        </p>

        {/* Changes */}
        <ChangesDetail changes={event.changes} />
      </div>

      {/* Meta: timestamp + action icon */}
      <div className='flex items-center gap-2 shrink-0 mt-0.5'>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`p-1 rounded-md bg-muted/50 ${config.color}`}>
              <Icon className='size-3.5' />
            </div>
          </TooltipTrigger>
          <TooltipContent side='left' className='text-xs'>
            {config.label}
          </TooltipContent>
        </Tooltip>

        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatRelativeTime(event.createdAt)}
        </span>
      </div>
    </div>
  );
};
