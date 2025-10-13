import z from 'zod';
import { isoDateString, isoString } from '../common';
import { ZIssue } from '../issues/issue';

const ZRankDecimal = z.preprocess((v) => {
  if (typeof v === 'string') return parseFloat(v);
  return parseFloat(v as any);
}, z.number());

export const ZBoardIssue = ZIssue.extend({
  rank: ZRankDecimal,
  boardId: z.string(),
  sprintId: z.string().nullable(),
});

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
  createdAt: isoString,
  updatedAt: isoString,

  // groupType: z.literal('statusId'),
  // groupParams: z.array(z.string()),
});

export const ZColumn = ZBoardColumn;
export const ZSprint = ZBoardSprint;

export type Board = z.infer<typeof ZBoard>;
export type BoardIssue = z.infer<typeof ZBoardIssue>;
export type BoardSprint = z.infer<typeof ZBoardSprint>;
export type BoardColumn = z.infer<typeof ZBoardColumn>;
