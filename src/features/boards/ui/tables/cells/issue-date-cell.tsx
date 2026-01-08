import { BoardIssueList } from '@/contracts/boards/board.query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { IssueDateSelectors } from '../../selectors/issue-date-selectors';
import { useMutation } from '@tanstack/react-query';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { toast } from 'sonner';

type IssueItem = BoardIssueList['data'][number];
type CellType = ColumnDef<IssueItem>['cell'];

const formatDate = (pre: Date | null, next: Date | null) => {
  if (!pre && !next) return null;
  if (pre && !next) return null;
  if (!pre && next) return format(next, 'yyyy-MM-dd');
  if (pre && next) {
    if (format(pre, 'yyyy-MM-dd') === format(next, 'yyyy-MM-dd')) return null;
    return format(next, 'yyyy-MM-dd');
  }
  return null;
};

export const IssueDueDateCell: CellType = ({ row }) => {
  const issue = row.original;
  const { dueDate: field } = issue;
  const value = field ? new Date(field) : null;
  const label = field ? format(new Date(field), 'MMM dd, yyyy') : 'No due date';

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleDueDateChange = (v: { label: string; value: Date | null } | null) => {
    if (updateIssue.isPending) return;
    const dueDate = formatDate(field ? new Date(field) : null, v?.value || null);
    toast.promise(updateIssue.mutateAsync({ dueDate }), {
      loading: 'Updating issue due date...',
      success: 'Issue due date updated',
      error: (err) => `Error updating issue due date: ${err.message}`,
    });
  };

  return (
    <IssueDateSelectors
      value={value ? { label, value } : null}
      label={label}
      placeholder='Select due date...'
      disabled={updateIssue.isPending}
      variant='outline'
      onChange={(option) => handleDueDateChange(option)}
    />
  );
};

export const IssueStartDateCell: CellType = ({ row }) => {
  const issue = row.original;
  const { startDate: field } = issue;
  const value = field ? new Date(field) : null;
  const label = field ? format(new Date(field), 'MMM dd, yyyy') : 'No start date';

  const params = { projectId: issue.projectId, issueId: issue.id, boardId: issue.boardId };
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const handleStartDateChange = (v: { label: string; value: Date | null } | null) => {
    if (updateIssue.isPending) return;
    const startDate = formatDate(field ? new Date(field) : null, v?.value || null);
    toast.promise(updateIssue.mutateAsync({ startDate }), {
      loading: 'Updating issue start date...',
      success: 'Issue start date updated',
      error: (err) => `Error updating issue start date: ${err.message}`,
    });
  };

  return (
    <IssueDateSelectors
      value={value ? { label, value } : null}
      label={label}
      placeholder='Select start date...'
      disabled={updateIssue.isPending}
      variant='outline'
      onChange={(option) => handleStartDateChange(option)}
    />
  );
};
