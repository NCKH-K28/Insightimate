import { useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import { toast } from 'sonner';

import { BoardIssueItem } from '@/contracts/boards/board.query';
import { moveBoardIssueMutationOptions } from '@/features/boards/api/actions';
import { ItemIssue } from '../ui/containers/scrum/scrum-item-issue';
import { MoveEvent, MoveRelative, ScrumRowProps } from '../ui/containers/scrum/scrum-board';
import { RowBacklog, RowSprint } from '../ui/containers/scrum';

const BACKLOG_ROW_ID = 'backlog';

export const useIssuesToScrumRows = (
  params: { boardId: string; projectId: string; orgSlug: string },
  issues: BoardIssueItem[],
  sprints: { id: string; name: string }[] = [],
): ScrumRowProps[] => {
  const moveIssue = useMutation(moveBoardIssueMutationOptions(params));

  const grouped = useMemo(
    () => groupBy(issues, (issue) => issue.sprintId ?? BACKLOG_ROW_ID),
    [issues],
  );

  const handleMoveIssue = useCallback(
    (issue: BoardIssueItem) => (event: MoveEvent, relative: MoveRelative | null) => {
      if (event.type !== 'item' || !relative || moveIssue.isPending) return;

      const movePromise = moveIssue.mutateAsync({
        issueId: issue.id,
        parentType: 'sprint',
        relative:
          relative.position === 'after'
            ? { type: 'after', refId: relative.afterId }
            : { type: relative.position },
        from: { parentId: issue.sprintId },
        to: { parentId: relative.rowId === BACKLOG_ROW_ID ? null : (relative.rowId ?? null) },
      });

      toast.promise(movePromise, {
        loading: 'Moving issue...',
        success: 'Issue moved',
        error: 'Failed to move issue',
      });
    },
    [moveIssue],
  );

  const createScrumItem = useCallback(
    (issue: BoardIssueItem): ScrumRowProps['items'][0] => ({
      id: issue.id,
      label: issue.summary,
      renderLabel: ({ id, rowId }, dnd) => (
        <ItemIssue id={id} rowId={rowId} issue={issue} dnd={dnd} />
      ),
      onMove: handleMoveIssue(issue),
    }),
    [handleMoveIssue],
  );

  const createRow = useCallback(
    (id: string, label: string, sprint?: any): ScrumRowProps => ({
      id,
      label,
      items: (grouped[id] || []).map(createScrumItem),
      renderRowHeader: (props) => {
        if (id === BACKLOG_ROW_ID)
          return <RowBacklog id={id} name={label} params={params} {...props} />;
        return <RowSprint id={id} params={params} sprint={sprint} {...props} />;
      },
    }),
    [grouped, createScrumItem, params],
  );

  return useMemo(() => {
    const sprintRows = sprints.map((sprint) =>
      createRow(sprint.id, sprint.name || `Sprint ${sprint.id}`, sprint),
    );

    return [...sprintRows, createRow(BACKLOG_ROW_ID, 'Backlog')];
  }, [sprints, createRow]);
};
