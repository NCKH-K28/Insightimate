import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { fieldToOption, IssueFieldSelectors } from './issue-field-selectors';
import { Skeleton } from '@/components/ui/skeleton';

type IssuePrioritySelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssuePrioritySelector = ({ params, disabled }: IssuePrioritySelectorProps) => {
  const { data: value, isPending } = useQuery({
    ...getBoardIssueQueryOptions({ boardId: params.boardId, issueId: params.issueId }),
    select: (res) => res.priority,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleUpdate = (data: { priorityId?: string }) => {
    return toast.promise(updateIssue.mutateAsync(data), {
      loading: 'Updating priority...',
      success: 'Priority updated',
      error: (err) => `Error updating priority: ${err.message}`,
    });
  };

  if (isPending) return <Skeleton className='h-8 w-full rounded-md' />;
  if (!value) return null;

  return (
    <IssueFieldSelectors
      value={fieldToOption(value)}
      disabled={disabled || updateIssue.isPending}
      onChange={(option) => {
        if (option.value) handleUpdate({ priorityId: option.value });
      }}
      placeholder='Select priority...'
      variant='ghost'
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.priorities,
      })}
    />
  );
};
