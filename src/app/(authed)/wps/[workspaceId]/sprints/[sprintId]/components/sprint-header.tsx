'use client';

import React, { useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { Calendar, Target, Clock, Settings, Play, CheckCircle2, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSuspenseQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/_client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { ActionsMenu } from '@/components/actions-menu';
import { SprintForm } from './sprint-form';
import { SprintHeaderSkeleton } from './sprint-header-skeleton';

import { Sprint } from '../mock-data';

type SprintHeaderProps = { params: { workspaceId: string; sprintId: string } };
function SprintHeader({ ...props }: SprintHeaderProps) {
  const { data: sprint } = useSuspenseQuery({
    queryKey: ['sprints', props.params.sprintId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/v2/sprints/${props.params.sprintId}`);
      const data = res.data;
      return data as Sprint;
    },
  });

  const daysRemaining = useMemo(() => {
    if (sprint.endAt) return differenceInDays(sprint.endAt, new Date());
    return null;
  }, [sprint.endAt]);

  const stateColors = {
    FUTURE: 'bg-slate-100 text-slate-700 border-slate-200',
    ACTIVE: 'bg-blue-100 text-blue-700 border-blue-200',
    CLOSED: 'bg-green-100 text-green-700 border-green-200',
  };

  const stateIcons = {
    FUTURE: <Clock className='h-3 w-3 mr-1' />,
    ACTIVE: <Play className='h-3 w-3 mr-1' />,
    CLOSED: <CheckCircle2 className='h-3 w-3 mr-1' />,
  };

  const handleCompleteSprint = () => {
    toast.success('Sprint completed successfully');
  };

  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <div className='bg-background'>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <SprintForm
            mode='edit'
            defaultValues={{
              name: sprint.name,
              goal: sprint.goal || undefined,
              startAt: sprint.startAt ? format(sprint.startAt, 'yyyy-MM-dd') : undefined,
              endAt: sprint.endAt ? format(sprint.endAt, 'yyyy-MM-dd') : undefined,
            }}
          />
        </DialogContent>
      </Dialog>

      <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-1'>
            <h1 className='text-lg sm:text-xl font-bold truncate'>{sprint.name}</h1>
            <Badge className={cn('flex items-center', stateColors[sprint.state])}>
              {stateIcons[sprint.state]}
              {sprint.state}
            </Badge>
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <div className='flex items-center gap-2'>
            {sprint.state === 'ACTIVE' && (
              <Button variant='default' size='sm' onClick={handleCompleteSprint}>
                <CheckCircle2 className='h-4 w-4' />
                Complete Sprint
              </Button>
            )}
            {sprint.state === 'FUTURE' && (
              <Button variant='default' size='sm'>
                <Play className='h-4 w-4' />
                Start Sprint
              </Button>
            )}
            <Button variant='outline' size='sm' className='hidden sm:flex'>
              <Settings className='h-4 w-4' />
              <span>Settings</span>
            </Button>
          </div>

          <ActionsMenu
            actions={[
              {
                id: 'edit',
                label: 'Edit',
                onClick: () => setEditOpen(true),
                icon: Edit,
              },
              {
                id: 'delete',
                label: 'Delete',
                onClick: () => toast.error('Delete sprint not implemented yet'),
                destructive: true,
                icon: Trash2,
              },
            ]}
          />
        </div>
      </div>

      {sprint.goal && (
        <div className='flex items-start gap-2 mb-3 p-3 bg-gradient-to-r from-slate-50 to-transparent rounded-lg border border-slate-100'>
          <Target className='h-4 w-4 text-primary mt-0.5 flex-shrink-0' />
          <div className='min-w-0'>
            <span className='text-xs font-medium text-muted-foreground block mb-0.5'>
              Sprint Goal
            </span>
            <p className='text-sm'>{sprint.goal}</p>
          </div>
        </div>
      )}

      <div className='flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground'>
        {sprint.startAt && sprint.endAt && (
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-4 w-4' />
            <span>
              {format(sprint.startAt, 'MMM d')} - {format(sprint.endAt, 'MMM d, yyyy')}
            </span>
          </div>
        )}
        {daysRemaining !== null && daysRemaining >= 0 && sprint.state === 'ACTIVE' && (
          <div className='flex items-center gap-1.5'>
            <Clock className='h-4 w-4' />
            <span
              className={cn(
                daysRemaining <= 2 && 'text-amber-600 font-medium',
                daysRemaining === 0 && 'text-red-600 font-medium',
              )}
            >
              {daysRemaining === 0
                ? 'Ends today!'
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
            </span>
          </div>
        )}
        {sprint.startedAt && (
          <div className='flex items-center gap-1.5'>
            <Play className='h-4 w-4' />
            <span>Started {formatDistanceToNow(sprint.startedAt, { addSuffix: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SprintHeader), {
  loading: () => <SprintHeaderSkeleton />,
});
