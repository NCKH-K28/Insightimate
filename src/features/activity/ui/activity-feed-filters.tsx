'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ActivityAction, ActivityEntity } from '@/contracts/activity';

// ==================== Config ====================

const ENTITY_OPTIONS: { value: ActivityEntity; label: string }[] = [
  { value: 'PROJECT', label: 'Projects' },
  { value: 'ISSUE', label: 'Issues' },
  { value: 'SPRINT', label: 'Sprints' },
  { value: 'COMMENT', label: 'Comments' },
  { value: 'TEAM', label: 'Teams' },
];

const ACTION_OPTIONS: { value: ActivityAction; label: string }[] = [
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' },
  { value: 'DELETED', label: 'Deleted' },
  { value: 'STATUS_CHANGED', label: 'Status changed' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'MEMBER_ADDED', label: 'Member added' },
  { value: 'MEMBER_REMOVED', label: 'Member removed' },
  { value: 'SPRINT_STARTED', label: 'Sprint started' },
  { value: 'SPRINT_CLOSED', label: 'Sprint closed' },
];

// ==================== Component ====================

type Filters = {
  entity?: ActivityEntity;
  action?: ActivityAction;
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export const ActivityFeedFilters: React.FC<Props> = ({ filters, onChange }) => {
  const hasFilters = filters.entity || filters.action;

  return (
    <div className='flex items-center gap-2 flex-wrap'>
      {/* Entity filter */}
      <Select
        value={filters.entity ?? ''}
        onValueChange={(v) => onChange({ ...filters, entity: (v || undefined) as ActivityEntity })}
      >
        <SelectTrigger className='w-[140px] h-8 text-xs'>
          <SelectValue placeholder='All types' />
        </SelectTrigger>
        <SelectContent>
          {ENTITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className='text-xs'>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action filter */}
      <Select
        value={filters.action ?? ''}
        onValueChange={(v) => onChange({ ...filters, action: (v || undefined) as ActivityAction })}
      >
        <SelectTrigger className='w-[160px] h-8 text-xs'>
          <SelectValue placeholder='All actions' />
        </SelectTrigger>
        <SelectContent>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className='text-xs'>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear button */}
      {hasFilters && (
        <Button
          variant='ghost'
          size='sm'
          className='h-8 px-2 text-xs text-muted-foreground'
          onClick={() => onChange({})}
        >
          <X className='size-3 mr-1' />
          Clear
        </Button>
      )}
    </div>
  );
};
