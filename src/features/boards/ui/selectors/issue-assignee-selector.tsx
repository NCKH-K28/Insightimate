import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { listProjectMembersQueryOptions } from '@/features/projects/api/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { unassignedUser, UserSelectors, userToOption } from '@/features/users/ui/user-selector';

const IssueFieldSkeleton = () => {
  return <Skeleton className='h-10 w-full rounded-md' />;
};

type IssueAssigneeSelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssueAssigneeSelector = ({ params }: IssueAssigneeSelectorProps) => {
  const { data: value, isPending } = useQuery({
    ...getBoardIssueQueryOptions({ boardId: params.boardId, issueId: params.issueId }),
    select: (res) => res.assignee,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleUpdate = (data: { assigneeId: string | null }) => {
    return toast.promise(updateIssue.mutateAsync(data), {
      loading: 'Updating issue status...',
      success: 'Issue status updated',
      error: (err) => `Error updating issue status: ${err.message}`,
    });
  };

  if (isPending) return <IssueFieldSkeleton />;

  return (
    <UserSelectors
      value={value ? userToOption(value) : null}
      extendOptions={[unassignedUser()]}
      fetchQueryOptions={() => ({
        ...listProjectMembersQueryOptions(params),
        select: (res) => res.members.data,
      })}
      disabled={updateIssue.isPending}
      placeholder='Unassigned'
      onChange={(option) => {
        if (option === null) handleUpdate({ assigneeId: null });
        else if (option.value) handleUpdate({ assigneeId: option.value });
      }}
      emptyMessage='No members found'
    />
  );
};
