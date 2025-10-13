import React from 'react';
import { toast } from 'sonner';
import { fieldToOption, IssueFieldSelectors } from '../../selectors/issue-field-selectors';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { useMutation } from '@tanstack/react-query';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';

import { BoardIssueList } from '@/contracts/boards/boards.query';
import { ColumnDef } from '@tanstack/react-table';

type IssueItem = BoardIssueList['data'][number];
type CellType = ColumnDef<IssueItem>['cell'];

export const IssuePriorityCell: CellType = ({ row }) => {
  const issue = row.original;
  const { priority: field } = issue;

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const handlePriorityChange = (priorityId?: string | null) => {
    if (!priorityId) throw new Error('Priority ID is required'); // Chưa hỗ  trợ xoá priority
    if (field?.id === priorityId) return; // No change
    return toast.promise(updateIssue.mutateAsync({ priorityId }), {
      loading: 'Updating issue priority...',
      success: 'Issue priority updated',
      error: (err) => `Error updating issue priority: ${err.message}`,
    });
  };

  return (
    <IssueFieldSelectors
      value={fieldToOption(field)}
      disabled={updateIssue.isPending}
      onChange={(option) => handlePriorityChange(option?.value)}
      placeholder='Select priority...'
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.priorities,
      })}
    />
  );
};
