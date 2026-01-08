import React from 'react';
import { toast } from 'sonner';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { useMutation } from '@tanstack/react-query';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { IssueFieldSelectors, fieldToOption } from '../../selectors/issue-field-selectors';
import { BoardIssueList } from '@/contracts/boards/board.query';
import { ColumnDef } from '@tanstack/react-table';

type IssueItem = BoardIssueList['data'][number];
type CellType = ColumnDef<IssueItem>['cell'];

export const IssueStatusCell: CellType = ({ row }) => {
  const issue = row.original;
  const { status: field } = issue;

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const handleStatusChange = (statusId?: string | null) => {
    if (!statusId) throw new Error('Status ID is required'); // Chưa hỗ  trợ xoá status
    if (field?.id === statusId) return; // No change
    return toast.promise(updateIssue.mutateAsync({ ...params, statusId }), {
      loading: 'Updating issue status...',
      success: 'Issue status updated',
      error: (err) => `Error updating issue status: ${err.message}`,
    });
  };

  return (
    <IssueFieldSelectors
      value={fieldToOption(field)}
      disabled={updateIssue.isPending}
      onChange={(option) => handleStatusChange(option?.value)}
      placeholder='Select status...'
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.statuses,
      })}
    />
  );
};
