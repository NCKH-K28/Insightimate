import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { IssueFieldSelectors, fieldToOption } from '../../selectors/issue-field-selectors';
import { BoardIssueList } from '@/contracts/boards/boards.query';
import { ColumnDef } from '@tanstack/react-table';

type IssueItem = BoardIssueList['data'][number];
type CellType = ColumnDef<IssueItem>['cell'];
export const IssueTypeCell: CellType = ({ row }) => {
  const issue = row.original;
  const { type: field } = issue;

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const handleTypeChange = (typeId?: string | null) => {
    if (!typeId) throw new Error('Type ID is required'); // Chưa hỗ  trợ xoá type
    if (field?.id === typeId) return; // No change
    return toast.promise(updateIssue.mutateAsync({ ...params, typeId }), {
      loading: 'Updating issue status...',
      success: 'Issue status updated',
      error: (err) => `Error updating issue status: ${err.message}`,
    });
  };

  return (
    <IssueFieldSelectors
      value={fieldToOption(field)}
      disabled={updateIssue.isPending}
      onChange={(option) => handleTypeChange(option?.value)}
      placeholder='Select type...'
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.types,
      })}
    />
  );
};
