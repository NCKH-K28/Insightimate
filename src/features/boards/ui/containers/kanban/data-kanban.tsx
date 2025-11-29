import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { boardApi } from '@/features/boards/api/http';
import { KanbanColumnHeader } from './kanban-column-header';
import type { BoardIssueItem } from '@/contracts/boards/boards.query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listProjectStatusesQueryOptions } from '@/features/projects/api/actions';

type ColumnKey = string;

interface KanbanColumnDef {
  id: string;
  name?: string;
  statuses?: { statusId: string }[];
}

interface DataKanbanProps {
  data: BoardIssueItem[];
  columns?: KanbanColumnDef[];
  onChange?: (next: BoardIssueItem[]) => void;
  projectId: string;
  boardId: string;
}

export const DataKanban = ({ data, onChange, projectId, boardId }: DataKanbanProps) => {
  const { data: statusesResponse } = useQuery(listProjectStatusesQueryOptions({ projectId }));

  const statuses = useMemo(() => {
    if (!statusesResponse) return [];
    return (statusesResponse as any).items || [];
  }, [statusesResponse]);

  const columns = useMemo(() => {
    if (!statuses || statuses.length === 0) return [];
    return [...statuses].sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }, [statuses]);

  const buildInitial = useCallback(() => {
    const map: Record<string, BoardIssueItem[]> = {};

    columns.forEach((status: any) => {
      map[status.id] = [];
    });

    (data || []).forEach((issue: BoardIssueItem) => {
      const statusId = issue.status?.id;
      if (statusId && map[statusId]) {
        map[statusId].push(issue);
      } else {
        const firstStatusId = columns[0]?.id;
        if (firstStatusId && map[firstStatusId]) {
          map[firstStatusId].push(issue);
        }
      }
    });

    Object.keys(map).forEach((statusId: string) => {
      map[statusId].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    });

    return map;
  }, [columns, data]);

  const [state, setState] = useState<Record<ColumnKey, BoardIssueItem[]>>(buildInitial);

  useEffect(() => {
    setState(buildInitial());
  }, [buildInitial]);

  const queryClient = useQueryClient();

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;
    const srcIndex = source.index;
    const dstIndex = destination.index;

    if (srcCol === dstCol && srcIndex === dstIndex) return;
    const prevState = state;

    const next = { ...prevState };
    const srcList = Array.from(next[srcCol] || []);
    const [moved] = srcList.splice(srcIndex, 1);
    next[srcCol] = srcList;

    const dstList = Array.from(next[dstCol] || []);
    dstList.splice(dstIndex, 0, moved);
    next[dstCol] = dstList;

    setState(next);
    onChange?.(Object.values(next).flat());

    try {
      if (!moved) return;
      await toast.promise(
        boardApi.issues.update({ boardId, issueId: String(moved.id) }, { statusId: dstCol }),
        {
          loading: 'Updating issue...',
          success: 'Issue updated',
          error: (err) => `Error: ${err?.message || 'Failed to update issue'}`,
        },
      );

      queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'issues'] });
    } catch (err) {
      console.error('Failed to update issue status after drag:', err);
      setState(prevState);
      onChange?.(Object.values(prevState).flat());
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className='flex overflow-x-auto p-4'>
        {columns.map((status: any) => (
          <div key={status.id} className='flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[240px]'>
            <KanbanColumnHeader
              label={status.name}
              taskCount={(state[status.id] || []).length}
              category={status.category}
              iconURL={status.iconURL}
              color={status.color}
              createParams={{ projectId, boardId, statusId: status.id }}
            />
            <Droppable droppableId={status.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className='min-h-[200px] py-1.5 space-y-2'
                >
                  {(state[status.id] || []).map((issue, idx) => (
                    <Draggable key={issue.id} draggableId={String(issue.id)} index={idx}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className='bg-white rounded-lg p-3 shadow'
                        >
                          <div className='text-xs text-muted-foreground font-medium'>
                            {issue.key ?? issue.id}
                          </div>
                          <div className='mt-1 text-sm font-semibold'>{issue.summary}</div>
                          {issue.storyPoints != null && (
                            <div className='mt-2 text-xs text-neutral-500'>
                              SP: {issue.storyPoints}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
