'use client';

import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActivityEventWithActor } from '@/contracts/activity';

import { ActivityIcon } from './activity-icons';
import {
  getActivityMessage,
  getChangeDetails,
  normalizeChanges,
  type MessageFragment,
} from './activity-helper';
import {
  AssigneeAction,
  StatusAction,
  PriorityAction,
  LabelAction,
  SprintAction,
  DefaultAction,
  type ActionRendererProps,
} from './actions';

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

// ==================== Fragment Renderer ====================

function renderFragment(fragment: MessageFragment, index: number): React.ReactNode {
  switch (fragment.type) {
    case 'text':
      return (
        <span key={index} className='text-muted-foreground'>
          {fragment.value}
        </span>
      );
    case 'bold':
      return (
        <span key={index} className='font-semibold text-foreground'>
          {fragment.value}
        </span>
      );
    case 'entity':
      return (
        <span
          key={index}
          className='font-semibold text-primary hover:underline cursor-pointer'
        >
          {fragment.value}
        </span>
      );
    case 'strikethrough':
      return (
        <span key={index} className='line-through text-muted-foreground/70'>
          {fragment.value}
        </span>
      );
    default:
      return null;
  }
}


// ==================== Action Renderer Dispatch ====================

function getActionRenderer(field: string): React.FC<ActionRendererProps> {
  switch (field) {
    case 'assignee':
    case 'assigneeId':
      return AssigneeAction;
    case 'status':
    case 'statusId':
      return StatusAction;
    case 'priority':
    case 'priorityId':
      return PriorityAction;
    case 'label':
    case 'labelId':
      return LabelAction;
    case 'sprint':
    case 'sprintId':
      return SprintAction;
    default:
      return DefaultAction;
  }
}

// ==================== Change Detail Lines ====================

function ChangeDetailLines({ event }: { event: ActivityEventWithActor }) {
  const changes = useMemo(() => normalizeChanges(event.changes), [event]);

  // Only show details for UPDATED events with multiple changes
  if (event.action !== 'UPDATED' || changes.length <= 1) return null;

  return (
    <div className='mt-1.5 ml-10 text-xs space-y-0.5'>
      {changes.slice(0, 4).map((change, i) => {
        const Renderer = getActionRenderer(change.field);
        return <Renderer key={i} change={change} event={event} />;
      })}
      {changes.length > 4 && (
        <span className='text-muted-foreground/60'>
          +{changes.length - 4} more changes
        </span>
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
  const message = useMemo(() => getActivityMessage(event), [event]);

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
        {/* Main line — actor name + human-readable sentence */}
        <p className='text-sm leading-relaxed flex flex-wrap items-baseline gap-x-1'>
          <span className='font-semibold text-foreground'>
            {event.actor?.name ?? event.actorName ?? 'Someone'}
          </span>
          {message.fragments.map((f, i) => renderFragment(f, i))}
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

        {/* Detailed change lines for multi-field updates */}
        <ChangeDetailLines event={event} />
      </div>

      {/* Meta: timestamp + action icon */}
      <div className='flex items-center gap-2 shrink-0 mt-0.5'>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ActivityIcon
                action={event.action}
                entity={event.entity}
                field={message.primaryField}
                size='md'
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side='left' className='text-xs'>
            {event.action.toLowerCase().replace(/_/g, ' ')}
          </TooltipContent>
        </Tooltip>

        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatRelativeTime(event.createdAt)}
        </span>
      </div>
    </div>
  );
};
