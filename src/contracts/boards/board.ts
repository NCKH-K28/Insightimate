import z from 'zod';
import { isoDateString, isoString } from '../_shared';
import { ZIssue } from '../issues/issue';

const ZRankDecimal = z.preprocess(
  (v: any) =>
    typeof v?.toNumber === 'function' ? v.toNumber() : typeof v === 'string' ? parseFloat(v) : v,
  z.number(),
);

/** Core schemas */
export const ZBoard = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['KANBAN', 'SCRUM']),
  createdAt: isoString,
  updatedAt: isoString,
});

export const ZBoardSprint = z.object({
  id: z.string(),
  name: z.string(),
  state: z.enum(['FUTURE', 'ACTIVE', 'CLOSED']),
  boardId: z.string(),
  startAt: isoDateString.nullable(),
  endAt: isoDateString.nullable(),
  goal: z.string().nullable(),
  createdAt: isoString,
  updatedAt: isoString,
});

export const ZBoardColumn = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullish(),
  boardId: z.string(),
  sequence: z.number(),

  createdAt: isoString,
  updatedAt: isoString,

  // groupType: z.literal('statusId'),
  // groupParams: z.array(z.string()),
});

export const ZBoardIssue = ZIssue.extend({
  rank: ZRankDecimal,
  boardId: z.string(),
  sprintId: z.string().nullable(),
});

/** Aliases */
export const ZColumn = ZBoardColumn;
export const ZSprint = ZBoardSprint;

/** Types */
export type Board = z.infer<typeof ZBoard>;
export type BoardSprint = z.infer<typeof ZBoardSprint>;
export type BoardColumn = z.infer<typeof ZBoardColumn>;
export type BoardIssue = z.infer<typeof ZBoardIssue>;

export type Column = BoardColumn;
export type Sprint = BoardSprint;
