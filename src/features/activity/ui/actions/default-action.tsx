'use client';

import React from 'react';
import type { ActionRendererProps } from './types';

function displayValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  return String(val);
}

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === '';
}

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  statusId: 'status',
  status: 'status',
  priorityId: 'priority',
  priority: 'priority',
  assigneeId: 'assignee',
  assignee: 'assignee',
  storyPoints: 'story points',
  story_points: 'story points',
  dueDate: 'due date',
  due_date: 'due date',
  startDate: 'start date',
  start_date: 'start date',
  summary: 'title',
  name: 'name',
  description: 'description',
  parentId: 'parent issue',
  parent_id: 'parent issue',
  sprintId: 'sprint',
  sprint_id: 'sprint',
  labelId: 'label',
  label: 'label',
  typeId: 'type',
  type: 'type',
  resolutionId: 'resolution',
  resolution: 'resolution',
  goal: 'goal',
  state: 'state',
};

function fieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] ?? field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

export const DefaultAction: React.FC<ActionRendererProps> = ({ change }) => {
  const fieldName = fieldDisplayName(change.field);
  const oldVal = change.oldLabel ?? displayValue(change.old);
  const newVal = change.newLabel ?? displayValue(change.new);

  if (isEmptyValue(change.old) && !isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1 flex-wrap'>
        <span className='text-muted-foreground'>set</span>
        <span className='font-semibold text-foreground'>{fieldName}</span>
        <span className='text-muted-foreground'>to</span>
        <span className='font-semibold text-foreground'>{newVal}</span>
      </div>
    );
  }

  if (!isEmptyValue(change.old) && isEmptyValue(change.new)) {
    return (
      <div className='flex items-center gap-1 flex-wrap'>
        <span className='text-muted-foreground'>removed</span>
        <span className='font-semibold text-foreground'>{fieldName}</span>
        <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1 flex-wrap'>
      <span className='text-muted-foreground'>changed</span>
      <span className='font-semibold text-foreground'>{fieldName}</span>
      <span className='text-muted-foreground'>from</span>
      <span className='line-through text-muted-foreground/70'>{oldVal}</span>
      <span className='text-muted-foreground'>to</span>
      <span className='font-semibold text-foreground'>{newVal}</span>
    </div>
  );
};
