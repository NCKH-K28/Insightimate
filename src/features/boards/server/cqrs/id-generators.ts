import { createId } from '@paralleldrive/cuid2';

export const genBoardId = () => `brd_${createId()}`;
export const genColumnId = () => `col_${createId()}`;
export const genSprintId = () => `spt_${createId()}`;
