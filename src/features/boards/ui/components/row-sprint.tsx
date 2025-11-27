import { Button } from '@/components/ui/button';
import React from 'react';
import { toast } from 'sonner';
import { format, getYear } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import {
  deleteBoardSprintMutationOptions,
  startBoardSprintMutationOptions,
} from '@/features/boards/api/actions';

import { UpdateSprintButton } from '../buttons/update-sprint-btn';
import { ChevronRight, EditIcon } from 'lucide-react';
import { SprintActions } from './sprint-actions';
import { CompleteSprintButton } from '../buttons/complete-sprint-btn';
import { CreateIssueButton } from '../buttons/create-issue-btn';
import { cn } from '@/lib/utils';
// ===

const formatSprintDates = (start: Date, end: Date) => {
  if (getYear(start) === getYear(end)) {
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}, ${format(start, 'yyyy')}`;
  }
  return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
};

type RowSprintProps = {
  id: string; // this is rowId
  params: { boardId: string; projectId: string };
  sprint: {
    id: string;
    boardId: string;
    name: string;
    startAt: string | null;
    endAt: string | null;
    state: 'FUTURE' | 'ACTIVE' | 'COMPLETED';
  };
  collapsed: boolean;
  toggle: () => void;
};

export const RowSprint = ({ id, params, sprint, collapsed, toggle }: RowSprintProps) => {
  const context = { boardId: params.boardId, sprintId: sprint.id, projectId: params.projectId };
  const deleteSprint = useMutation(deleteBoardSprintMutationOptions(context));
  const startSprint = useMutation(startBoardSprintMutationOptions(context));
  // const completeSprint = useMutation(completeBoardSprintMutationOptions(context));

  const handleDelete = () => {
    if (deleteSprint.isPending) return;
    toast.promise(deleteSprint.mutateAsync({}), {
      loading: 'Deleting sprint...',
      success: 'Sprint deleted!',
      error: 'Failed to delete sprint',
    });
  };

  const handleStartSprint = () => {
    if (startSprint.isPending) return;
    toast.promise(startSprint.mutateAsync({}), {
      loading: 'Starting sprint...',
      success: 'Sprint started!',
      error: 'Failed to start sprint',
    });
  };

  // const handleCompleteSprint = () => {
  //   if (completeSprint.isPending) return;
  //   toast.promise(completeSprint.mutateAsync({}), {
  //     loading: 'Completing sprint...',
  //     success: 'Sprint completed!',
  //     error: 'Failed to complete sprint',
  //   });
  // };

  const items = [];

  return (
    <div className='flex justify-between items-center w-full'>
      <Button
        size='icon'
        type='button'
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={`row-items-${id}`}
        variant='ghost'
      >
        <ChevronRight className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-90')} />
      </Button>
      <div className='w-full flex items-center gap-2 text-sm'>
        <span className='text-foreground font-semibold'>{sprint.name}</span>
        <span className='text-muted-foreground text-xs'>({items.length} issues)</span>
        <div>
          {sprint.startAt && sprint.endAt ? (
            <span className='text-xs text-gray-500'>
              {formatSprintDates(new Date(sprint.startAt), new Date(sprint.endAt))}
            </span>
          ) : (
            <UpdateSprintButton
              params={context}
              defaultValues={sprint}
              renderLabel={() => {
                return (
                  <Button variant='ghost' size='sm' className='p-0 underline'>
                    <EditIcon className='mr-1' />
                    <span className='text-xs'>Set dates</span>
                  </Button>
                );
              }}
            />
          )}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          disabled={!sprint.startAt || !sprint.endAt}
          hidden={sprint.state !== 'FUTURE'}
          variant='outline'
          size='sm'
          onClick={handleStartSprint}
        >
          Start Sprint
        </Button>
        <CompleteSprintButton params={context} hidden={sprint.state !== 'ACTIVE'} />
        <CreateIssueButton
          params={context}
          typeRequired={true}
          typeFilterFn={(t) => t.hierarchy == 1}
          typeFetched={(types, setType) => {
            const defaultType = types.find((t) => t.hierarchy === 1);
            if (defaultType) setType(defaultType.id);
          }}
        />
        <SprintActions params={context} onDelete={handleDelete} defaultValues={sprint} />
      </div>
    </div>
  );
};
