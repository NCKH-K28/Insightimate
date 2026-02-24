'use client';

import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { FileText, Bug, Inbox, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { AssignedIssue } from '@/features/organization/server/dashboard.service';

// ==================== Helpers ====================

function getTypeIcon(typeName: string) {
  const lower = typeName.toLowerCase();
  if (lower.includes('bug')) return Bug;
  return FileText;
}

function getTypeIconStyle(typeName: string) {
  const lower = typeName.toLowerCase();
  if (lower.includes('bug')) return 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400';
  return 'bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-400';
}

const PRIORITY_STYLES: Record<string, string> = {
  highest: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  lowest: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function getPriorityStyle(priorityName: string) {
  return PRIORITY_STYLES[priorityName.toLowerCase()] ?? PRIORITY_STYLES.medium;
}

function formatDueDate(dueDate: Date | null): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isToday(d)) return 'Due Today';
  if (isPast(d)) return 'Overdue';
  return `Due in ${format(d, 'MMM d')}`;
}

// ==================== Component ====================

type AssignedToMeProps = {
  issues: AssignedIssue[];
};

export const AssignedToMe: React.FC<AssignedToMeProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Inbox className='size-4 text-muted-foreground' />
            Assigned to Me
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center py-6 text-center'>
          <CheckCircle2 className='size-8 text-emerald-400/50 mb-2' />
          <p className='text-sm font-medium text-muted-foreground'>All clear!</p>
          <p className='text-xs text-muted-foreground/70 mt-0.5'>No open issues assigned to you</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Inbox className='size-4 text-muted-foreground' />
            Assigned to Me
          </CardTitle>
          <button className='text-xs text-primary hover:underline font-medium'>View all</button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='divide-y'>
          {issues.map((issue) => {
            const TypeIcon = getTypeIcon(issue.type.name);
            const typeStyle = getTypeIconStyle(issue.type.name);
            const dueDateLabel = formatDueDate(issue.dueDate);
            const isOverdue = issue.dueDate && isPast(new Date(issue.dueDate));

            return (
              <div key={issue.id} className='flex items-center gap-3 py-3 first:pt-1 last:pb-0'>
                {/* Type icon */}
                <div
                  className={`size-9 rounded-full flex items-center justify-center shrink-0 ${typeStyle}`}
                >
                  <TypeIcon className='size-4' />
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>{issue.summary}</p>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Project: {issue.project.name}
                    {dueDateLabel && (
                      <>
                        {' • '}
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          {dueDateLabel}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Priority pill */}
                {issue.priority && (
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${getPriorityStyle(issue.priority.name)}`}
                  >
                    {issue.priority.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
