'use client';

import React, { useMemo, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import {
  Calendar,
  Target,
  Clock,
  Play,
  CheckCircle2,
  Edit,
  Trash2,
  Link2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { ActionsMenu } from '@/components/actions-menu';
import { SprintForm } from './sprint-form';
import { SprintHeaderSkeleton } from './sprint-header-skeleton';
import { CompleteSprintForm } from '@/features/boards/ui/forms/complete-sprint-form';
import {
  sprintDetailQueryOptions,
  updateSprintMutationOptions,
  startSprintMutationOptions,
  deleteSprintMutationOptions,
} from '@/features/sprints/api/actions';
import { useRouter } from 'next/navigation';

type SprintHeaderProps = { params: { orgSlug: string; sprintId: string } };

function SprintHeader({ params }: SprintHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Data ──────────────────────────────────────────────────────────────
  const { data: sprint } = useSuspenseQuery(sprintDetailQueryOptions(params.sprintId));

  const daysRemaining = useMemo(() => {
    if (sprint.endAt) return differenceInDays(sprint.endAt, new Date());
    return null;
  }, [sprint.endAt]);

  const progress = useMemo(() => {
    const agg = (sprint as any)?._aggregations?.issues;
    if (!agg) return null;
    const total = agg._counts?.total ?? 0;
    const completed = agg._counts?.completed ?? 0;
    if (total === 0) return { total: 0, completed: 0, pct: 0 };
    return { total, completed, pct: Math.round((completed / total) * 100) };
  }, [sprint]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const updateSprint = useMutation({
    ...updateSprintMutationOptions(params.sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', params.sprintId] });
      toast.success('Sprint updated');
      setEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update sprint');
    },
  });

  const startSprint = useMutation({
    ...startSprintMutationOptions(params.sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', params.sprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint started!');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to start sprint');
    },
  });

  const deleteSprint = useMutation({
    ...deleteSprintMutationOptions(params.sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint deleted');
      router.push(`/o/${params.orgSlug}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete sprint');
    },
  });

  // ── UI State ──────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [completeOpen, setCompleteOpen] = React.useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleStartSprint = useCallback(() => {
    startSprint.mutate(undefined as any);
  }, [startSprint]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  }, []);

  // ── Style maps ────────────────────────────────────────────────────────
  const stateColors: Record<string, string> = {
    FUTURE: 'bg-slate-100 text-slate-700 border-slate-200',
    ACTIVE: 'bg-blue-100 text-blue-700 border-blue-200',
    CLOSED: 'bg-green-100 text-green-700 border-green-200',
  };

  const stateIcons: Record<string, React.ReactNode> = {
    FUTURE: <Clock className='h-3 w-3 mr-1' />,
    ACTIVE: <Play className='h-3 w-3 mr-1' />,
    CLOSED: <CheckCircle2 className='h-3 w-3 mr-1' />,
  };

  const canStart = sprint.state === 'FUTURE' && sprint.startAt && sprint.endAt;

  return (
    <div className='bg-background'>
      {/* ── Edit Dialog ────────────────────────────────────────────── */}
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
            onSubmit={(data) => {
              updateSprint.mutate({
                name: data.name,
                goal: data.goal ?? null,
                startAt: data.startAt ?? null,
                endAt: data.endAt ?? null,
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Complete Sprint Dialog ─────────────────────────────────── */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <CompleteSprintForm
            params={{ boardId: (sprint as any).boardId, sprintId: params.sprintId }}
            onComplete={() => {
              setCompleteOpen(false);
              queryClient.invalidateQueries({ queryKey: ['sprint', params.sprintId] });
            }}
            onCancel={() => setCompleteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sprint.name}&quot;? This action cannot be undone.
              All issues will be moved to the backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => deleteSprint.mutate(undefined as any)}
              disabled={deleteSprint.isPending}
            >
              {deleteSprint.isPending ? 'Deleting...' : 'Delete Sprint'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Header Row ─────────────────────────────────────────────── */}
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
              <Button
                variant='default'
                size='sm'
                onClick={() => setCompleteOpen(true)}
              >
                <CheckCircle2 className='h-4 w-4' />
                Complete Sprint
              </Button>
            )}
            {sprint.state === 'FUTURE' && (
              <Button
                variant='default'
                size='sm'
                onClick={handleStartSprint}
                disabled={!canStart || startSprint.isPending}
              >
                <Play className='h-4 w-4' />
                {startSprint.isPending ? 'Starting...' : 'Start Sprint'}
              </Button>
            )}
          </div>

          <ActionsMenu
            actions={[
              ...(sprint.state !== 'CLOSED'
                ? [
                    {
                      id: 'edit',
                      label: 'Edit',
                      onClick: () => setEditOpen(true),
                      icon: Edit,
                    },
                  ]
                : []),
              {
                id: 'copy-link',
                label: 'Copy link',
                onClick: handleCopyLink,
                icon: Link2,
              },
              {
                id: 'delete',
                label: 'Delete',
                onClick: () => setDeleteOpen(true),
                destructive: true,
                icon: Trash2,
              },
            ]}
          />
        </div>
      </div>

      {/* ── Goal ───────────────────────────────────────────────────── */}
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

      {/* ── Metadata Bar ──────────────────────────────────────────── */}
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

        {(sprint as any).startedAt && (
          <div className='flex items-center gap-1.5'>
            <Play className='h-4 w-4' />
            <span>Started {formatDistanceToNow((sprint as any).startedAt, { addSuffix: true })}</span>
          </div>
        )}

        {/* Progress summary in header */}
        {progress && progress.total > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-xs font-medium'>
              {progress.completed}/{progress.total} issues
            </span>
            <div className='w-24'>
              <Progress value={progress.pct} className='h-1.5' />
            </div>
            <span className='text-xs font-medium'>{progress.pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SprintHeader), {
  loading: () => <SprintHeaderSkeleton />,
});
