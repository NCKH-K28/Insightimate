import { useCallback, useMemo } from 'react';
import { GripVertical } from 'lucide-react';

import type { BoardIssueItem } from '@/contracts/boards/boards.query';
import { fieldToOption, IssueFieldSelectors } from '../selectors/issue-field-selectors';
import { unassignedUser, UserSelectors, userToOption } from '../../../users/ui/user-selector';
import { cn } from '@/lib/utils';
import {
  getProjectQueryOptions,
  listProjectMembersQueryOptions,
} from '@/features/projects/api/actions';
import { useMutation } from '@tanstack/react-query';
import {
  deleteBoardIssueMutationOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { EditableText } from '@/components/editable-text';
import { EditableStorypoints } from '@/components/editable-storypoints';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSortable } from '@dnd-kit/sortable';
import { BoardIssueActions } from './board-issue-actionts';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export type IssueItemProps = {
  id: string;
  rowId: string;
  issue: BoardIssueItem;

  dnd: {
    attributes: ReturnType<typeof useSortable>['attributes'];
    listeners: ReturnType<typeof useSortable>['listeners'];
  };
};

export const ItemIssue = ({ issue, dnd }: IssueItemProps) => {

  // FIXME: use workspace root path from context or hook
  const pathname = usePathname();
  const p = useParams<{
    workspaceId: string;
  }>();

  const wspRoot = useMemo(
    () => {
      // p: wps/{workspaceId}/...
      const reg = new RegExp(`/wps/${p.workspaceId}(/|$)`);
      const match = pathname.match(reg);
      if (match) {
        return match[0].replace(/\/$/, ''); // remove trailing slash
      }
      return `/wps/${p.workspaceId}`;
    },
    [pathname, p.workspaceId],
  );
  //============


  const params = useMemo(
    () => ({ boardId: issue.boardId, issueId: issue.id, projectId: issue.projectId }),
    [issue],
  );

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const deleteIssue = useMutation(deleteBoardIssueMutationOptions(params));

  const handleUpdate = useCallback(
    (data: typeof updateIssue.variables) => {
      if (updateIssue.isPending) return;
      if (!data) throw new Error('No data to update');
      toast.promise(updateIssue.mutateAsync(data), {
        loading: 'Updating issue...',
        success: 'Issue updated',
        error: (err) => `Error: ${err.message || 'Failed to update issue'}`,
      });
    },
    [updateIssue],
  );

  const handleDelete = useCallback(() => {
    if (deleteIssue.isPending) return;
    toast.promise(deleteIssue.mutateAsync({}), {
      loading: 'Deleting issue...',
      success: 'Issue deleted',
      error: (err) => `Error: ${err.message || 'Failed to delete issue'}`,
    });
  }, [deleteIssue]);

  return (
    <div
      className={cn(
'group relative flex items-center gap-3 rounded-lg border border-transparent bg-background px-3 py-1 transition-all',
        'hover:border-border hover:bg-accent/50 hover:shadow-sm',
        updateIssue.isPending && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Drag Handle */}
      <div
        className='flex-shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100'
        {...dnd.listeners}
        {...dnd.attributes}
      >
        <GripVertical className='h-4 w-4 text-muted-foreground' />
      </div>

      {/* Issue Type */}
      <div className='flex-shrink-0'>
        <IssueFieldSelectors
          value={fieldToOption(issue.type)}
          triggerOptions={{ showLabel: false }}
          className='w-auto border-0 bg-transparent hover:bg-accent'
          fetchQueryOptions={() => ({
            ...getProjectQueryOptions(params),
            select: (res) => res.types,
          })}
          disabled={updateIssue.isPending}
          onChange={(option) => option.value && handleUpdate({ typeId: option.value })}
        />
      </div>

      <Link
        href={`${wspRoot}/projects/${issue.projectId}/issues/${issue.id}`}
        className="text-xs font-medium text-muted-foreground opacity-90"
      >
        {issue.key}
      </Link>

      {/* Issue Summary - Flexible width */}
      <div className='min-w-0 flex-1'>
        <EditableText
          defaultValue={issue.summary}
          className='w-full text-sm'
          onBlur={(summary) => {
            const trimmed = summary?.trim();
            if (trimmed === issue.summary) return;
            handleUpdate({ summary: trimmed });
          }}
        />
      </div>

      {/* Right side controls with consistent spacing */}
      <div className='flex flex-shrink-0 items-center gap-2'>
        {/* Status */}
        <div className='w-32'>
          <IssueFieldSelectors
            value={fieldToOption(issue.status)}
            className='w-full'
            fetchQueryOptions={() => ({
              ...getProjectQueryOptions(params),
              select: (res) => res.statuses,
            })}
            disabled={updateIssue.isPending}
            onChange={(option) => option.value && handleUpdate({ statusId: option.value })}
          />
        </div>

        <Separator orientation='vertical' className='h-5' />

        {/* Priority */}
        <div className='flex-shrink-0'>
          <IssueFieldSelectors
            value={fieldToOption(issue.priority)}
            triggerOptions={{ showLabel: false }}
            className='w-auto border-0 bg-transparent hover:bg-accent'
            fetchQueryOptions={() => ({
              ...getProjectQueryOptions(params),
              select: (res) => res.priorities,
            })}
            disabled={updateIssue.isPending}
            onChange={(option) => option.value && handleUpdate({ priorityId: option.value })}
          />
        </div>
<Separator orientation='vertical' className='h-5' />

        {/* Assignee */}
        <div className='w-40'>
          <UserSelectors
            value={issue.assignee ? userToOption(issue.assignee) : null}
            className='w-full'
            extendOptions={[unassignedUser()]}
            fetchQueryOptions={() => ({
              ...listProjectMembersQueryOptions(params),
              select: (res) => res.members.data,
            })}
            disabled={updateIssue.isPending}
            placeholder='Unassigned'
            onChange={(option) => handleUpdate({ assigneeId: option?.value ? option.value : null })}
            emptyMessage='No members found'
          />
        </div>

        <Separator orientation='vertical' className='h-5' />

        {/* Story Points */}
        <div className='w-16 text-center'>
          <EditableStorypoints
            defaultValue={issue.storyPoints}
            onBlur={(value) => handleUpdate({ storyPoints: value })}
          />
        </div>

        <Separator orientation='vertical' className='h-5' />

        {/* Actions */}
        <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
          <BoardIssueActions onDelete={() => handleDelete()} disabled={deleteIssue.isPending} />
        </div>
      </div>

      {/* Loading overlay */}
      {updateIssue.isPending && (
        <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-background/80'>
          <Skeleton className='h-4 w-20' />
        </div>
      )}
    </div>
  );
};