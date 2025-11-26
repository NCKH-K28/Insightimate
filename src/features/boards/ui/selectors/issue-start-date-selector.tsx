import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { getBoardIssueQueryOptions, updateBoardIssueMutationOptions } from '../../api/actions';
import { IssueDateSelectors } from './issue-date-selectors';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type IssueStartDateSelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssueStartDateSelector = ({ params }: IssueStartDateSelectorProps) => {
  const { data: issue } = useSuspenseQuery(getBoardIssueQueryOptions(params));
  const { startDate } = issue ?? {};

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleStartDateChange = (v: { label: string; value: Date | null } | null) => {
    const startDate = v?.value ? format(v.value, 'yyyy-MM-dd') : null;
    toast.promise(updateIssue.mutateAsync({ startDate }), {
      loading: 'Updating due date...',
      success: 'Due date updated successfully',
      error: 'Failed to update due date',
    });
  };

  const value = useMemo(() => {
    if (!startDate) return null;
    return { label: startDate, value: new Date(startDate) };
  }, [startDate]);

  return (
    <IssueDateSelectors
      value={value}
      label='Due Date'
      placeholder='Select due date...'
      disabled={updateIssue.isPending}
      variant='outline'
      onChange={(option) => handleStartDateChange(option)}
    />
  );
};
