import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { BoardIssueList } from '@/contracts/boards/boards.query';
import { useMutation } from '@tanstack/react-query';
import { listProjectMembersQueryOptions } from '@/features/projects/api/actions';
import { get } from 'lodash';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { UserMinus } from 'lucide-react';
import { UserSelectors } from '@/features/users/ui/user-selector';

type IssueItem = BoardIssueList['data'][number];
type CellType = ColumnDef<IssueItem>['cell'];

export const IssueAssigneeCell: CellType = ({ row }) => {
  const issue = row.original;
  const { assignee, assigneeId } = issue;

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const value = React.useMemo(() => {
    if (!assignee) return { value: null, label: 'Unassigned' };
    return { value: assignee.id, label: assignee.name };
  }, [assignee]);

  if (assigneeId && !assignee) {
    return <div className='text-sm text-red-500'>Unknown</div>;
  }

  const handleChange = (v: { value: string | null } | null) => {
    const next = v?.value || null;
    const prev = assigneeId || null;
    if (next === prev) return;
    toast.promise(updateIssue.mutateAsync({ assigneeId: next }), {
      loading: 'Updating assignee...',
      success: 'Assignee updated',
      error: (err) => `Error: ${err.message || 'Failed to update assignee'}`,
    });
  };

  return (
    <UserSelectors
      value={value}
      extendOptions={[
        { value: null, label: 'Unassigned', icon: <UserMinus className='h-4 w-4' /> },
      ]}
      popoverClassName='w-72'
      fetchQueryOptions={() => ({
        ...listProjectMembersQueryOptions(params),
        select: (res) => get(res, 'members.data', []), // FIXME: should be res.data
      })}
      disabled={updateIssue.isPending}
      placeholder='Unassigned'
      onChange={handleChange}
      emptyMessage='No members found'
    />
  );
};
