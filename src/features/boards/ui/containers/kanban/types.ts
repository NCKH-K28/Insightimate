/**
 * Type definitions for the Kanban board
 */

export type MoveRelative =
  | { position: 'top' | 'bottom'; columnId?: string }
  | { position: 'after'; afterId: string; columnId?: string };

export type Column = {
  id: string;
  title: string;
  iconURL?: string | null;
  color?: string | null;
  order: number;
};

export type Card = {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  order: number;
  data?: {
    type: { id: string; name: string; iconURL?: string | null };
    priority: { id: string; name: string; iconURL?: string | null };
    assignee?: { id: string; name: string; avatar?: string | null } | null;
    reporter?: { id: string; name: string; avatar?: string | null } | null;
    dueDate?: string | null;
  };
};

export interface KanbanBoardProps {
  columns: Column[];
  cards: Card[];
  onMove(cardId: string, move: MoveRelative): void;
  onColumnChange?(columns: Column[]): void;
  onCardChange?(cards: Card[]): void;
}
