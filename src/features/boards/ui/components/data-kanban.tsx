
import {
    DragDropContext,
    Draggable,
    Droppable,
    type DropResult,
} from '@hello-pangea/dnd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KanbanColumnHeader } from './kanban-column-header';
import type { BoardIssueItem } from '@/contracts/boards/boards.query';

type ColumnKey = string;

interface KanbanColumnDef {
    id: string;
    name?: string;
    statuses?: { statusId: string }[];
}

interface DataKanbanProps {
    data: BoardIssueItem[];
    columns?: KanbanColumnDef[]; // optional board-defined columns
    onChange?: (next: BoardIssueItem[]) => void;
}

// For this view we only want three columns
const FIXED_COLUMNS: ColumnKey[] = ['todo', 'in_progress', 'done'];

export const DataKanban = ({ data, columns: propsColumns, onChange }: DataKanbanProps) => {
    // Always show only the three fixed columns
    const columns = useMemo(() => FIXED_COLUMNS, []);

    const groupKey = (it: BoardIssueItem) => String(it.status?.id ?? it.status?.name ?? 'unknown').toLowerCase();

    const buildInitial = useCallback(() => {
        const map: Record<ColumnKey, BoardIssueItem[]> = {};
        columns.forEach((c: ColumnKey) => (map[c] = []));

        // Assign each issue to one of the fixed columns based on status id or name.
        // Matching strategy: look for common names/ids that map to todo, in_progress, done.
        (data || []).forEach((it: BoardIssueItem) => {
            const statusRaw = String(it.status?.id ?? it.status?.name ?? '').toLowerCase();
            let colId: ColumnKey = 'todo';

            if (statusRaw.includes('done') || statusRaw.includes('closed') || statusRaw === 'done') colId = 'done';
            else if (statusRaw.includes('in_progress') || statusRaw.includes('in progress') || statusRaw.includes('progress') || statusRaw === 'in_progress') colId = 'in_progress';
            else if (statusRaw.includes('todo') || statusRaw.includes('to do') || statusRaw === 'todo' || statusRaw === 'backlog') colId = 'todo';

            if (!map[colId]) map[colId] = [];
            map[colId].push(it);
        });

        Object.keys(map).forEach((k: string) => {
            map[k].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        });
        return map;
    }, [columns, data, propsColumns]);

    const [state, setState] = useState<Record<ColumnKey, BoardIssueItem[]>>(buildInitial);

    useEffect(() => {
        setState(buildInitial());
    }, [buildInitial]);

    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        const srcCol = source.droppableId;
        const dstCol = destination.droppableId;
        const srcIndex = source.index;
        const dstIndex = destination.index;

        if (srcCol === dstCol && srcIndex === dstIndex) return;

        setState((prev) => {
            const next = { ...prev };
            const srcList = Array.from(next[srcCol] || []);
            const [moved] = srcList.splice(srcIndex, 1);
            next[srcCol] = srcList;

            const dstList = Array.from(next[dstCol] || []);
            dstList.splice(dstIndex, 0, moved);
            next[dstCol] = dstList;

            onChange?.(Object.values(next).flat());
            return next;
        });
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex overflow-x-auto p-4">
                {columns.map((colId) => (
                    <div key={colId} className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[240px]">
                        <KanbanColumnHeader label={colId} taskCount={(state[colId] || []).length} />
                        <Droppable droppableId={colId}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="min-h-[200px] py-1.5 space-y-2"
                                >
                                    {(state[colId] || []).map((issue, idx) => (
                                        <Draggable key={issue.id} draggableId={String(issue.id)} index={idx}>
                                            {(prov) => (
                                                <div
                                                    ref={prov.innerRef}
                                                    {...prov.draggableProps}
                                                    {...prov.dragHandleProps}
                                                    className="bg-white rounded-lg p-3 shadow"
                                                >
                                                    <div className="text-xs text-muted-foreground font-medium">{issue.key ?? issue.id}</div>
                                                    <div className="mt-1 text-sm font-semibold">{issue.summary}</div>
                                                    {issue.storyPoints != null && <div className="mt-2 text-xs text-neutral-500">SP: {issue.storyPoints}</div>}
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