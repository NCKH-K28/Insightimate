'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { getBoardIssueQueryOptions } from '@/features/boards/api/actions';
import { useCallback } from 'react';
import { deleteBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { toast } from 'sonner';

import IssueMainPanel from '@/features/boards/ui/components/issue-main-panel';
import IssueSidePanel from '@/features/boards/ui/components/issue-side-panel';

export default function Page() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    issueId: string;
  }>();

  const { data: project } = useQuery(getProjectQueryOptions({ projectId: params.projectId }));

  const router = useRouter();

  const boardId = project?.boardId;
  const { data: issue } = useQuery({
    ...getBoardIssueQueryOptions({ boardId: boardId ?? '', issueId: params.issueId }),
    enabled: Boolean(boardId),
  });

  const updateMutation = useMutation(
    updateBoardIssueMutationOptions({ boardId: boardId ?? '', issueId: params.issueId }),
  );
  const deleteMutation = useMutation(
    deleteBoardIssueMutationOptions({ boardId: boardId ?? '', issueId: params.issueId }),
  );

  const handleUpdate = useCallback(
    (data: any) => {
      if (updateMutation.isPending) return;
      toast.promise(updateMutation.mutateAsync(data), {
        loading: 'Updating issue...',
        success: 'Issue updated',
        error: (err) => `Error: ${err?.message || 'Failed to update issue'}`,
      });
    },
    [updateMutation],
  );

  const handleDelete = async () => {
    if (deleteMutation.isPending) return;
    await toast.promise(deleteMutation.mutateAsync({}), {
      loading: 'Deleting issue...',
      success: 'Issue deleted',
      error: (err) => `Error: ${err?.message || 'Failed to delete issue'}`,
    });
    router.push(`/wps/${params.workspaceId}/projects/${params.projectId}`);
  };

  if (!issue) throw new Error('Issue not found');

  return (
    <div className='flex flex-1 overflow-y-auto size-full'>
      <IssueMainPanel issue={issue} onUpdate={handleUpdate} />
      <IssueSidePanel
        issue={issue}
        project={project}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        workspaceId={params.workspaceId}
        projectId={params.projectId}
      />
    </div>
  );
}
