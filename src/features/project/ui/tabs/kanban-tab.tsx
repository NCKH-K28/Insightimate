'use client';

import { KanbanBoard } from '@/features/boards/ui/containers/kanban-v2';
import {
  findColumn,
  findItem,
  ItemData,
  KanbanBoardRef,
} from '@/features/boards/ui/containers/kanban-v2/ui';
import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/_client';
import {
  BoardColumnItem,
  BoardIssueItem,
  ZBoardColumnItem,
  ZBoardColumnList,
  ZBoardIssueItem,
} from '@/contracts/boards/board.query';
import { listBoardIssuesQueryOptions } from '@/features/boards/api/actions';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { toast } from 'sonner';
import { MoveIssueInputV2 } from '@/contracts/boards/board.input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createId } from '@paralleldrive/cuid2';
import { ColumnForm } from '@/features/boards/ui/forms/column-form';
import { ColumnItem } from '@/features/boards/ui/containers/kanban-v2/ui';
import { IssueForm } from '@/features/boards/ui/forms/issue-form';

// ========================== Types ==========================

type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';
type StatusOption = {
  id: string;
  name: string;
  color?: string;
  iconURL?: string;
  category: StatusCategory;
};
type ProjectField = { id: string; name: string; color?: string | null; iconURL?: string | null };

type SubmitPayload = {
  mode: 'create' | 'update';
  data: { id: string; name: string; statuses: StatusOption[] };
};

type KanbanColumnDialogProps = {
  mode: 'create' | 'update';
  statusOpts?: StatusOption[];
  column?: { id: string; data: { name: string; statuses: StatusOption[] } };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderLabel?: () => React.ReactNode;
  onSubmit?: (payload: SubmitPayload) => void;
};

type KanbanItemDialogProps = {
  mode: 'create' | 'update';
  params: { projectId: string; boardId: string };
  open: boolean;
  onClose: () => void;
  item?: ColumnItem;
};

// ========================== Helpers ==========================

const sanitizeIssue = (issue: BoardIssueItem): ItemData => ({
  ...issue,
  description: issue.description ?? undefined,
  assigneeId: issue.assigneeId ?? undefined,
  startDate: issue.startDate ?? undefined,
  dueDate: issue.dueDate ?? undefined,
  storyPoints: issue.storyPoints ?? undefined,
  assignee: issue.assignee
    ? { ...issue.assignee, avatar: issue.assignee.avatar ?? undefined }
    : undefined,
  type: {
    ...issue.type,
    color: issue.type.color ?? undefined,
    iconURL: issue.type.iconURL ?? undefined,
  },
  priority: {
    ...issue.priority,
    color: issue.priority.color ?? undefined,
    iconURL: issue.priority.iconURL ?? undefined,
  },
  status: {
    ...issue.status,
    color: issue.status.color ?? undefined,
    iconURL: issue.status.iconURL ?? undefined,
  },
});

const formatStatus = (status: ProjectField & { category: StatusCategory }) => ({
  ...status,
  color: status.color ?? undefined,
  iconURL: status.iconURL ?? undefined,
});

const buildBoard = (columns: BoardColumnItem[], issues: BoardIssueItem[]) => {
  const toColumnIdMap = new Map<string, string>(
    columns.flatMap((col) => col.statuses.map((s) => [s.id, col.id])),
  );
  const sorted = issues.sort((a, b) => a.rank - b.rank);
  return {
    columns: columns.map((col) => ({
      id: col.id,
      data: { name: col.name, statuses: col.statuses.map(formatStatus) },
      items: sorted
        .filter((issue) => toColumnIdMap.get(issue.statusId) === col.id)
        .map((issue) => ({ id: issue.id, columnId: col.id, data: sanitizeIssue(issue) })),
    })),
  };
};

// ========================== Dialogs ==========================

const fmtStatus = (s: StatusOption) => ({
  name: s.name,
  category: s.category,
  color: s.color ?? '#94a3b8',
  iconURL: s.iconURL,
});

function KanbanColumnDialog(props: KanbanColumnDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>{props.mode === 'create' ? 'Create Column' : 'Update Column'}</DialogTitle>
        </DialogHeader>
        <ColumnForm
          mode={props.mode}
          defaultValues={
            props.column?.data && {
              name: props.column.data.name,
              statuses: props.column.data.statuses.map(fmtStatus),
            }
          }
          onSubmit={(v) => {
            if (!props.onSubmit) return;
            props.onSubmit({
              mode: props.mode,
              data: {
                ...v,
                id: props.column?.id ?? createId(),
                statuses: v.statuses.map((s) => ({ ...s, id: (s as any).id ?? createId() })),
              },
            });
          }}
        />
        <DialogFooter className='gap-2 sm:gap-0' />
      </DialogContent>
    </Dialog>
  );
}

function KanbanItemDialog({ mode, params, open, onClose, item }: KanbanItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[680px]'>
        <DialogHeader>
          <DialogTitle>{item ? 'Update Issue' : 'Create Issue'}</DialogTitle>
        </DialogHeader>
        <IssueForm mode={mode} defaultValues={item?.data} params={params} />
      </DialogContent>
    </Dialog>
  );
}

// ========================== Skeleton ==========================

const KanbanTabSkeleton = () => (
  <div className='flex size-full gap-4 overflow-x-auto p-4'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className='flex w-[350px] shrink-0 flex-col gap-4 rounded-lg border bg-muted/10 p-4'
      >
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='size-8 rounded-full' />
        </div>
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className='h-32 w-full rounded-md' />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ========================== Main Tab ==========================

type KanbanTabProps = { params: { boardId: string; projId: string } };

export function KanbanTab({ params }: KanbanTabProps) {
  const { projId, boardId } = params;

  const moveIssue = useMutation({
    mutationFn: async (i: MoveIssueInputV2) => {
      const path = `/v3/boards/${boardId}/issues:move`;
      const res = await axiosInstance.post(path, i);
      return ZBoardIssueItem.parse(res.data);
    },
  });

  const { data: project } = useQuery({ ...getProjectQueryOptions({ projId }) });
  const kanbanRef = useRef<KanbanBoardRef>(null);

  const { data: columns, isPending: columnsPending } = useQuery({
    queryKey: ['board-columns', boardId],
    queryFn: async () => {
      const path = `/v3/boards/${boardId}/columns`;
      const res = await axiosInstance.get(path);
      return ZBoardColumnList.parse(res.data);
    },
    select: ({ data }) => data,
  });

  const { data: issues, isPending: issuesPending } = useQuery({
    ...listBoardIssuesQueryOptions(boardId, {}),
    select: ({ data }) => data,
  });

  const [columnDialog, setColumnDialog] = useState<KanbanColumnDialogProps | null>(null);
  const [itemDialog, setItemDialog] = useState<KanbanItemDialogProps | null>(null);

  const _board = useMemo(() => buildBoard(columns ?? [], issues ?? []), [columns, issues]);

  const handleColumnSubmit = async (payload: SubmitPayload) => {
    if (payload.mode === 'create') {
      const path = `/v3/boards/${boardId}/columns`;
      const { data: result } = await axiosInstance.post(path, payload.data);
      const column = ZBoardColumnItem.parse(result);
      kanbanRef.current?.addColumn({
        id: column.id,
        data: { name: column.name, statuses: column.statuses.map(formatStatus) },
        items: [],
      });
    }
    setColumnDialog(null);
  };

  if (columnsPending || issuesPending) return <KanbanTabSkeleton />;

  return (
    <div className='size-full'>
      {itemDialog && <KanbanItemDialog {...itemDialog} onClose={() => setItemDialog(null)} />}
      {columnDialog && (
        <KanbanColumnDialog
          {...columnDialog}
          renderLabel={() => null}
          onOpenChange={() => setColumnDialog(null)}
          onSubmit={handleColumnSubmit}
        />
      )}

      <KanbanBoard
        ref={kanbanRef}
        board={_board}
        onRemoveItem={() => {}}
        onColumnReorder={async (e) => {
          const path = `/v3/boards/${boardId}/columns:reorder`;
          const newIds = e.columns.map((c) => c.id);
          const res = await axiosInstance.post(path, { ids: newIds });
          return res.data;
        }}
        onAddItem={(e, board) => {
          const col = findColumn(board, e.columnId);
          if (!col) return;
          setItemDialog({
            open: true,
            params: { projectId: projId, boardId },
            mode: 'create',
            onClose: () => setItemDialog(null),
          });
        }}
        onEditItem={(e, board) => {
          const col = findColumn(board, e.item.columnId);
          if (!col) return;
          const item = findItem(board, e.item.id);
          if (!item) return;
          setItemDialog({
            open: true,
            mode: 'update',
            params: { projectId: projId, boardId },
            onClose: () => setItemDialog(null),
            item: e.item,
          });
        }}
        onEditColumn={(e) => {
          const col = findColumn(_board, e.column.id);
          if (!col) return;
          setColumnDialog({
            open: true,
            mode: 'update',
            onOpenChange: () => setColumnDialog(null),
            column: {
              id: col.id,
              data: { name: col.data.name, statuses: col.data.statuses.map(formatStatus) },
            },
          });
        }}
        onMove={({ from, to }, board) => {
          toast
            .promise(moveIssue.mutateAsync({ from, to }), {
              loading: 'Moving issue...',
              success: 'Issue moved successfully',
              error: 'Failed to move issue',
            })
            .unwrap()
            .then((data) => {
              const item = findItem(board, data.id);
              if (!item) return;
              const col = findColumn(board, item.columnId);
              if (!col) return;
              kanbanRef.current?.updateItem({
                id: data.id,
                columnId: col.id,
                data: sanitizeIssue(data),
              });
            });
        }}
        onAddColumn={() => {
          setColumnDialog({ open: true, mode: 'create' });
        }}
        onRemoveColumn={() => {}}
      />
    </div>
  );
}
