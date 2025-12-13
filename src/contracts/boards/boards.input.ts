import z from 'zod';
import { ZSprint } from './board';

/** ===================== BOARD ISSUES ===================== */

export const ZBoardIssueCreateInput = z.object({
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  typeId: z.string().optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  resolutionId: z.string().optional(),
  reporterId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),

  dueDate: z.iso.date().optional().nullable(),
  startDate: z.iso.date().optional().nullable(),

  storyPoints: z.number().optional().nullable(),
  sprintId: z.string().optional().nullable(),
});

export const ZBoardIssueUpdateInput = ZBoardIssueCreateInput.partial();

export const ZBoardIssueRankUpdate = z.object({
  src: z.object({ id: z.string(), parentId: z.string().nullable() }),
  dest: z.object({
    id: z.string().optional(),
    parentId: z.string().nullable(),
    type: z.enum(['after', 'before', 'top', 'bottom']),
  }),
  in: z.enum(['SCRUM', 'KANBAN']),
});

/** Move helpers */
const StaticRelative = z.object({ type: z.enum(['top', 'bottom']) });
const DynamicRelative = z.object({ type: z.enum(['after', 'before']), refId: z.string() });
const ZRelative = z.union([StaticRelative, DynamicRelative]);

export const ZBoardIssueMoveInput = z.object({
  parentType: z.enum(['sprint', 'status']),
  relative: ZRelative,
  from: z.object({ parentId: z.string().nullable() }),
  to: z.object({ parentId: z.string().nullable() }),
});

/** Issue types */
export type BoardIssueCreateInput = z.infer<typeof ZBoardIssueCreateInput>;
export type BoardIssueUpdateInput = z.infer<typeof ZBoardIssueUpdateInput>;
export type BoardIssueRankUpdate = z.infer<typeof ZBoardIssueRankUpdate>;
export type BoardIssueMoveInput = z.infer<typeof ZBoardIssueMoveInput>;

/** ===================== BOARD SPRINTS ===================== */

export const ZBoardSprintCreateInput = z.object({
  name: z.string().min(1, 'Sprint name is required').optional(),
  goal: z.string().nullish(),
  state: z.enum(['FUTURE', 'ACTIVE', 'CLOSED']).optional(),
  startAt: z.iso.date().optional().nullable(),
  endAt: z.iso.date().optional().nullable(),
});

export const ZBoardSprintUpdateInput = ZBoardSprintCreateInput.omit({ state: true }).partial();

/** Sprint complete */
type ToMoveToSprint = `to:sp_${string}`;
const ZMoveToSprint = z
  .string()
  .regex(
    /^to:sp_[a-zA-Z0-9]+$/,
    'Invalid sprint ID format: to:<sprintId>',
  ) as z.ZodType<ToMoveToSprint>;

export const ZBoardSprintCompleteInput = z.object({
  effect: z.union([
    z.literal('delete'),
    z.literal('to:backlog'),
    z.literal('to:new_sprint'),
    ZMoveToSprint,
  ]),
});

/** Board sprint types */
export type BoardSprintCreateInput = z.infer<typeof ZBoardSprintCreateInput>;
export type BoardSprintUpdateInput = z.infer<typeof ZBoardSprintUpdateInput>;
export type BoardSprintCompleteInput = z.infer<typeof ZBoardSprintCompleteInput>;

/** ===================== SPRINT (business rules) ===================== */

export const ZSprintWithBusiness = ZSprint.superRefine((data, ctx) => {
  if (data.startAt && data.endAt && new Date(data.startAt) >= new Date(data.endAt)) {
    ctx.addIssue({
      code: 'custom',
      path: ['startAt', 'endAt'],
      message: 'Sprint start date must be before end date',
    });
  }
});

export const ZSprintCreateInput = ZSprintWithBusiness.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ name: true });

export const ZSprintUpdateInput = ZSprintCreateInput;

/** Sprint types */
export type SprintCreateInput = z.infer<typeof ZSprintCreateInput>;
export type SprintUpdateInput = z.infer<typeof ZSprintUpdateInput>;
