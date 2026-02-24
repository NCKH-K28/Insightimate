'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Circle, Clock, AlertTriangle, Inbox } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { AssignedIssue } from '@/features/organization/server/dashboard.service';

// ==================== Helpers ====================

const STATUS_CATEGORY_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  TODO: {
    icon: Circle,
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  IN_PROGRESS: {
    icon: Clock,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  DONE: {
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
};

// ==================== Component ====================

type AssignedToMeProps = {
  issues: AssignedIssue[];
};

export const AssignedToMe: React.FC<AssignedToMeProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <Card className='border-dashed'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Inbox className='size-4 text-muted-foreground' />
            Assigned to Me
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
          <CheckCircle2 className='size-10 text-emerald-400/40 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>All clear!</p>
          <p className='text-xs text-muted-foreground/70 mt-1'>
            You have no open issues assigned to you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Inbox className='size-4 text-muted-foreground' />
            Assigned to Me
          </CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {issues.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='divide-y'>
          {issues.map((issue) => {
            const statusDef =
              STATUS_CATEGORY_STYLES[issue.status.category] ?? STATUS_CATEGORY_STYLES.TODO;
            const StatusIcon = statusDef.icon;
            const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

            return (
              <div key={issue.id} className='flex items-start gap-3 py-3 first:pt-0 last:pb-0'>
                {/* Status icon */}
                <div className='mt-0.5 shrink-0'>
                  <StatusIcon
                    className='size-4'
                    style={{ color: issue.status.color ?? undefined }}
                  />
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-xs font-mono text-muted-foreground'>{issue.key}</span>
                    <span className='text-sm font-medium truncate'>{issue.summary}</span>
                  </div>
                  <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
                    <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                      {issue.project.key}
                    </Badge>
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusDef.className}`}>
                      {issue.status.name}
                    </Badge>
                    {issue.priority && (
                      <Badge
                        variant='outline'
                        className='text-[10px] px-1.5 py-0'
                        style={{ borderColor: issue.priority.color ?? undefined }}
                      >
                        {issue.priority.name}
                      </Badge>
                    )}
                    {issue.dueDate && (
                      <span
                        className={`text-[10px] flex items-center gap-0.5 ${
                          isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground/60'
                        }`}
                      >
                        {isOverdue && <AlertTriangle className='size-2.5' />}
                        {formatDistanceToNow(new Date(issue.dueDate), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
