import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { fieldToOption, IssueFieldSelectors } from './issue-field-selectors';
import { Skeleton } from '@/components/ui/skeleton';

const IssueFieldSkeleton = () => {
  return <Skeleton className='h-10 w-full rounded-md' />;
};

type IssueStatusSelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssueStatusSelector = ({ params }: IssueStatusSelectorProps) => {
  const { data: value, isPending } = useQuery({
    ...getBoardIssueQueryOptions({ boardId: params.boardId, issueId: params.issueId }),
    select: (res) => res.status,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleUpdate = (data: { statusId?: string }) => {
    return toast.promise(updateIssue.mutateAsync(data), {
      loading: 'Updating issue status...',
      success: 'Issue status updated',
      error: (err) => `Error updating issue status: ${err.message}`,
    });
  };

  if (isPending) return <IssueFieldSkeleton />;
  if (!value) throw new Error('Issue status not found');

  return (
    <IssueFieldSelectors
      value={fieldToOption(value)}
      disabled={updateIssue.isPending}
      onChange={(option) => {
        if (option.value) handleUpdate({ statusId: option.value });
      }}
      placeholder='Select status...'
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.statuses,
      })}
    />
  );
};

{
  /* <IssueFieldSelectors
  value={fieldToOption(issue.status)}
  className='w-full'
  fetchQueryOptions={() => ({
    ...getProjectQueryOptions(params),
    select: (res) => res.statuses,
  })}
  disabled={updateIssue.isPending}
  onChange={(option) => option.value && handleUpdate({ statusId: option.value })}
/>; */
}
