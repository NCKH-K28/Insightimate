import { atom } from 'jotai';

// === Types ===
export type ItemData = {
  summary: string;
  key: string;
  projectId: string;
  description?: string;
  statusId: string;
  priorityId: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  type: { id: string; name: string; color?: string; iconURL?: string };
  priority: { id: string; name: string; color?: string; iconURL?: string };
  status: { id: string; name: string; color?: string; iconURL?: string };
  assignee?: { id: string; name: string; avatar?: string };
  storyPoints?: number;
};

export type ColumnData = {
  name: string;
  statuses: {
    id: string;
    name: string;
    color?: string;
    iconURL?: string;
    category: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }[];
};
export type ColumnItem = { id: string; columnId: string; data: ItemData };
export type Column = { id: string; data: ColumnData; items: ColumnItem[] };
export type Board = { columns: Column[] };
export type KanbanBoardRef = {
  getBoard(): Board;
  addColumn(input: Column): void;
  addItem(input: ColumnItem): void;
  updateColumn(input: Column): void;
  updateItem(input: ColumnItem): void;
  removeColumn(input: Column): void;
  removeItem(input: ColumnItem): void;
};

// === Atoms ===
export const boardAtom = atom<Board>({ columns: [] });

// === ID Generators ===
export const colDndId = (columnId: string) => `col:${columnId}`;
export const colEndDndId = (columnId: string) => `col-end:${columnId}`;
export const itemDndId = (itemId: string) => `item:${itemId}`;

// === ID Parsers ===
export const parseColId = (id: string) => (id.startsWith('col:') ? id.slice(4) : null);
export const parseColEndId = (id: string) => (id.startsWith('col-end:') ? id.slice(8) : null);
export const parseItemId = (id: string) => (id.startsWith('item:') ? id.slice(5) : null);

// === Utilities ===
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function findItem(board: Board, itemId: string) {
  for (const col of board.columns) {
    const idx = col.items.findIndex((it) => it.id === itemId);
    if (idx !== -1) return { columnId: col.id, index: idx, item: col.items[idx] };
  }
  return null;
}

export function findColumn(board: Board, columnId: string) {
  return board.columns.find((c) => c.id === columnId) ?? null;
}

/**
 * Robust helper to determine which column is being hovered/targeted,
 * even if the `over` ID points to an item or an end-zone.
 */
export function getOverColumnIdForColumnDrag(overRaw: string | null, board: Board): string | null {
  if (!overRaw) return null;

  // 1. Is it a column?
  const colId = parseColId(overRaw);
  if (colId) return colId;

  // 2. Is it a column end-zone?
  const endColId = parseColEndId(overRaw);
  if (endColId) return endColId;

  // 3. Is it an item?
  const itemId = parseItemId(overRaw);
  if (itemId) {
    const found = findItem(board, itemId);
    if (found) return found.columnId;
  }

  return null;
}
