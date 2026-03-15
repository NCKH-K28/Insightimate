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
  Tag,
  Signal,
  AlertCircle,
  GitBranch,
  CalendarDays,
  Target,
  LayoutList,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityAction, ActivityEntity } from '@/contracts/activity';

// ==================== Icon Registry ====================

/**
 * Maps (action, entity?) pairs to the appropriate icon and styling.
 * Ordered from most-specific to least-specific — the lookup in
 * `getActivityIconConfig` iterates and returns the first match.
 */

type IconOption = {
  icon: LucideIcon;
  /** Tailwind text color for the icon */
  color: string;
  /** Tailwind background for the container badge */
  bg: string;
};

// ── Per-action defaults ─────────────────────────────────────────────────

const ACTION_ICONS: Record<ActivityAction, IconOption> = {
  CREATED: { icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  UPDATED: { icon: Pencil, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  DELETED: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
  MOVED: { icon: ArrowRight, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ASSIGNED: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  UNASSIGNED: { icon: UserMinus, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  COMMENTED: { icon: MessageSquare, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  LOGGED_TIME: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  STATUS_CHANGED: { icon: Signal, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  SPRINT_STARTED: { icon: Play, color: 'text-green-500', bg: 'bg-green-500/10' },
  SPRINT_CLOSED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  MEMBER_ADDED: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  MEMBER_REMOVED: { icon: UserMinus, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ROLE_CHANGED: { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

// ── Field-specific overrides (for UPDATED action) ───────────────────────

const FIELD_ICONS: Record<string, IconOption> = {
  status: { icon: Signal, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  statusId: { icon: Signal, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  priority: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  priorityId: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  assignee: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  assigneeId: { icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  label: { icon: Tag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  labelId: { icon: Tag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  dueDate: { icon: CalendarDays, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  startDate: { icon: CalendarDays, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  storyPoints: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  parent: { icon: GitBranch, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  parentId: { icon: GitBranch, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  sprint: { icon: LayoutList, color: 'text-green-500', bg: 'bg-green-500/10' },
  sprintId: { icon: LayoutList, color: 'text-green-500', bg: 'bg-green-500/10' },
};

// ==================== Lookup ====================

export type ActivityIconConfig = IconOption;

/**
 * Resolve the best icon config for a given activity event.
 * If the event is an UPDATED with a single field change, we try the
 * field-specific icon first.
 */
export function getActivityIconConfig(
  action: ActivityAction,
  _entity?: ActivityEntity,
  field?: string | null,
): IconOption {
  // Field-level override for UPDATED events
  if (action === 'UPDATED' && field && FIELD_ICONS[field]) {
    return FIELD_ICONS[field];
  }

  return ACTION_ICONS[action] ?? ACTION_ICONS.UPDATED;
}

// ==================== Component ====================

type ActivityIconProps = {
  action: ActivityAction;
  entity?: ActivityEntity;
  field?: string | null;
  className?: string;
  /** Size of the outer badge (defaults to size-7) */
  size?: 'sm' | 'md';
};

/**
 * Renders a rounded icon badge with contextual colors for a given
 * activity action / entity / field combination.
 */
export const ActivityIcon: React.FC<ActivityIconProps> = ({
  action,
  entity,
  field,
  className,
  size = 'md',
}) => {
  const config = getActivityIconConfig(action, entity, field);
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'size-6' : 'size-7';
  const iconSize = size === 'sm' ? 'size-3' : 'size-3.5';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md shrink-0',
        sizeClasses,
        config.bg,
        className,
      )}
    >
      <Icon className={cn(iconSize, config.color)} />
    </div>
  );
};
