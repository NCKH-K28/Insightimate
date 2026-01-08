import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { getBoardIssueQueryOptions, updateBoardIssueMutationOptions } from '../../api/actions';
import { IssueDateSelectors } from './issue-date-selectors';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type IssueDueDateSelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssueDueDateSelector = ({ params }: IssueDueDateSelectorProps) => {
  const { data: issue } = useSuspenseQuery(getBoardIssueQueryOptions(params));
  const { dueDate, startDate } = issue ?? {};

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleDueDateChange = (v: { label: string; value: Date | null } | null) => {
    const dueDate = v?.value ? format(v.value, 'yyyy-MM-dd') : null;
    toast.promise(updateIssue.mutateAsync({ dueDate }), {
      loading: 'Updating due date...',
      success: 'Due date updated successfully',
      error: 'Failed to update due date',
    });
  };

  // nêu due date < start date thì báo lỗi (van cho chọn)
  const errorMessage = useMemo(() => {
    if (!dueDate || !startDate) return null;
    const due = new Date(dueDate);
    const start = new Date(startDate);
    if (due < start) return 'Due date cannot be earlier than start date';
    return null;
  }, [dueDate, startDate]);

  const value = useMemo(() => {
    if (!dueDate) return null;
    return { label: dueDate, value: new Date(dueDate) };
  }, [dueDate]);

  return (
    <IssueDateSelectors
      value={value}
      label='Due Date'
      placeholder='Select due date...'
      disabled={updateIssue.isPending}
      variant='outline'
      onChange={(option) => handleDueDateChange(option)}
      className={errorMessage ? 'error' : ''}
    />
  );
};
