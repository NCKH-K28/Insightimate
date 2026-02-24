import { executeTransaction, prisma, TransactionClient } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import {
  BoardSprintCompleteInput,
  BoardSprintCreateInput,
  BoardSprintUpdateInput,
} from '@/contracts/boards/board.input';
import { validateBoardSprint } from '@/lib/validators';
import { ZBoardSprint } from '@/contracts/boards/board';
import { Prisma } from '@prisma/client';
import { listIssuesWithDescendants, sumStoryPoints } from './q-sprint-summary';
import { emitActivity } from '@/features/activity/server/emit-activity';

interface SprintContext {
  boardId: string;
  sprintId: string;
  actorId?: string;
}

interface SprintQuery {
  sum?: { storyPoints?: boolean };
  count?: { issues?: boolean };
}

interface SprintAggregations {
  issues: {
    _counts: {
      total?: number;
      completed?: number;
      incompleted?: number;
    };
    _sums: {
      storyPoints: {
        completed?: number;
        incompleted?: number;
      };
    };
  };
}

// ============================================================================
// Constants
// ============================================================================

const SPRINT_STATE = {
  FUTURE: 'FUTURE',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

const INCOMPLETE_ISSUE_EFFECTS = {
  DELETE: 'delete',
  TO_BACKLOG: 'to:backlog',
  TO_NEW_SPRINT: 'to:new_sprint',
  TO_SPRINT_PREFIX: 'to:sp_',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

const generateSprintId = (): string => `sp_${createId()}`;

// ============================================================================
// Validation Functions
// ============================================================================

const ensureSprintExists = async (
  tx: Prisma.TransactionClient,
  ctx: SprintContext,
): Promise<NonNullable<Awaited<ReturnType<typeof tx.sprint.findUnique>>>> => {
  const sprint = await tx.sprint.findUnique({
    where: { id: ctx.sprintId, boardId: ctx.boardId },
  });
  if (!sprint) throw new Error('Sprint not found');
  return sprint;
};

const ensureNoActiveSprint = async (
  tx: Prisma.TransactionClient,
  boardId: string,
): Promise<void> => {
  const activeSprint = await tx.sprint.findFirst({
    where: { boardId, state: SPRINT_STATE.ACTIVE },
  });
  if (activeSprint) {
    throw new Error('There is already an ACTIVE sprint on this board');
  }
};

const ensureSprintCanStart = (
  sprint: NonNullable<Awaited<ReturnType<typeof prisma.sprint.findUnique>>>,
): void => {
  if (sprint.state !== SPRINT_STATE.FUTURE) {
    throw new Error('Only FUTURE sprints can be started');
  }
  if (!sprint.startAt) {
    throw new Error('Sprint must have a start date to be started');
  }
  if (!sprint.endAt) {
    throw new Error('Sprint must have an end date to be started');
  }
};

const ensureSprintCanComplete = (
  sprint: NonNullable<Awaited<ReturnType<typeof prisma.sprint.findUnique>>>,
): void => {
  if (sprint.state !== SPRINT_STATE.ACTIVE) {
    throw new Error('Only ACTIVE sprints can be completed');
  }
};

// ============================================================================
// Aggregation Functions
// ============================================================================

const getIssueAggregations = async (
  ctx: SprintContext,
  query: SprintQuery,
): Promise<SprintAggregations> => {
  const baseWhere: Prisma.IssueWhereInput = {
    boards: { some: { boardId: ctx.boardId, sprintId: ctx.sprintId } },
  };

  const [completedStats, incompletedStats] = await Promise.all([
    prisma.issue.aggregate({
      where: { ...baseWhere, resolvedAt: { not: null } },
      _sum: { storyPoints: true },
      _count: { _all: true },
    }),
    prisma.issue.aggregate({
      where: { ...baseWhere, resolvedAt: null },
      _sum: { storyPoints: true },
      _count: { _all: true },
    }),
  ]);

  const totalCount = completedStats._count._all + incompletedStats._count._all;

  return {
    issues: {
      _counts: {
        total: query.count?.issues ? totalCount : undefined,
        completed: query.count?.issues ? completedStats._count._all : undefined,
        incompleted: query.count?.issues ? incompletedStats._count._all : undefined,
      },
      _sums: {
        storyPoints: {
          completed: query.sum?.storyPoints ? (completedStats._sum.storyPoints ?? 0) : undefined,
          incompleted: query.sum?.storyPoints
            ? (incompletedStats._sum.storyPoints ?? 0)
            : undefined,
        },
      },
    },
  };
};

// ============================================================================
// Sprint CRUD Operations
// ============================================================================

export const getSprintById = async (ctx: SprintContext, query: SprintQuery) => {
  const sprint = await ensureSprintExists(prisma, ctx);
  const aggregations = await getIssueAggregations(ctx, query);

  return {
    ...sprint,
    _aggregations: aggregations,
  };
};

export const createBoardSprint = async (
  ctx: { boardId: string },
  input: BoardSprintCreateInput,
  client: TransactionClient = prisma,
) => {
  return executeTransaction(client, async (tx) => {
    const board = await tx.board.findUnique({ where: { id: ctx.boardId } });
    if (!board) throw new Error('Board not found');

    const project = await tx.project.update({
      where: { id: board.projectId },
      data: { sprintCounter: { increment: 1 } },
    });

    const maxSequence = await tx.sprint.aggregate({
      _max: { sequence: true },
      where: { boardId: board.id },
    });

    const sequence = (maxSequence._max.sequence ?? -1) + 1;
    const name = input.name ?? `Sprint ${project.sprintCounter}`;
    const state = input.state ?? SPRINT_STATE.FUTURE;

    return tx.sprint.create({
      data: {
        ...input,
        id: generateSprintId(),
        name,
        state,
        boardId: board.id,
        sequence,
      },
    });
  });
};

export const updateBoardSprint = async (ctx: SprintContext, input: BoardSprintUpdateInput) => {
  return prisma.$transaction(
    async (tx) => {
      const sprint = await ensureSprintExists(tx, ctx);

      const dto = { ...sprint, ...input };
      const validSprint = ZBoardSprint.superRefine(validateBoardSprint).parse(dto);

      const startAt = validSprint.startAt ? new Date(validSprint.startAt) : null;
      const endAt = validSprint.endAt ? new Date(validSprint.endAt) : null;

      return tx.sprint.update({
        where: { id: ctx.sprintId },
        data: { ...validSprint, startAt, endAt },
      });
    },
    { isolationLevel: 'Serializable' },
  );
};

export const deleteBoardSprint = async (ctx: SprintContext) => {
  return prisma.$transaction(
    async (tx) => {
      await ensureSprintExists(tx, ctx);

      await tx.boardIssue.deleteMany({ where: { sprintId: ctx.sprintId, boardId: ctx.boardId } });
      await tx.sprint.delete({ where: { id: ctx.sprintId } });

      return { success: true };
    },
    { isolationLevel: 'Serializable' },
  );
};

// ============================================================================
// Sprint State Management
// ============================================================================

export const startBoardSprint = async (ctx: SprintContext) => {
  return prisma.$transaction(
    async (tx) => {
      const sprint = await ensureSprintExists(tx, ctx);
      ensureSprintCanStart(sprint);
      await ensureNoActiveSprint(tx, ctx.boardId);

      const issues = await listIssuesWithDescendants(ctx.sprintId);
      const committedPoints = sumStoryPoints(issues);

      const updated = await tx.sprint.update({
        where: { id: ctx.sprintId },
        data: { state: SPRINT_STATE.ACTIVE, committedPoints },
      });

      // --- activity feed ---
      const project = await prisma.project.findFirst({
        where: { board: { id: ctx.boardId } },
      });
      if (project) {
        emitActivity({
          orgId: project.orgId,
          projectId: project.id,
          actorId: ctx.actorId || 'system',
          action: 'SPRINT_STARTED',
          entity: 'SPRINT',
          entityId: ctx.sprintId,
          entityTitle: sprint.name,
          changes: [{ field: 'state', old: SPRINT_STATE.FUTURE, new: SPRINT_STATE.ACTIVE }],
        });
      }

      return updated;
    },
    { isolationLevel: 'Serializable' },
  );
};

// ============================================================================
// Complete Sprint Logic
// ============================================================================

const handleIncompleteIssues = async (
  tx: Prisma.TransactionClient,
  ctx: SprintContext,
  effect: string,
): Promise<void> => {
  const whereClause = {
    boardId: ctx.boardId,
    sprintId: ctx.sprintId,
    issue: { resolvedAt: null },
  };

  switch (effect) {
    case INCOMPLETE_ISSUE_EFFECTS.DELETE:
      await tx.boardIssue.deleteMany({ where: whereClause });
      break;

    case INCOMPLETE_ISSUE_EFFECTS.TO_BACKLOG:
      await tx.boardIssue.updateMany({
        where: whereClause,
        data: { sprintId: null },
      });
      break;

    case INCOMPLETE_ISSUE_EFFECTS.TO_NEW_SPRINT: {
      const newSprint = await createBoardSprint({ boardId: ctx.boardId }, {}, tx);
      await tx.boardIssue.updateMany({
        where: whereClause,
        data: { sprintId: newSprint.id },
      });
      break;
    }

    default:
      if (effect.startsWith(INCOMPLETE_ISSUE_EFFECTS.TO_SPRINT_PREFIX)) {
        await moveIssuesToSprint(tx, ctx, whereClause, effect);
      } else {
        throw new Error(`Invalid effect: ${effect}`);
      }
  }
};

const moveIssuesToSprint = async (
  tx: Prisma.TransactionClient,
  ctx: SprintContext,
  whereClause: Prisma.BoardIssueWhereInput,
  effect: string,
): Promise<void> => {
  const toSprintId = effect.replace('to:', '');
  const toSprint = await tx.sprint.findUnique({ where: { id: toSprintId, boardId: ctx.boardId } });

  if (!toSprint) throw new Error('Target sprint not found');

  if (toSprint.state === SPRINT_STATE.CLOSED) {
    throw new Error('Cannot move issues to a CLOSED sprint');
  }

  await tx.boardIssue.updateMany({ where: whereClause, data: { sprintId: toSprint.id } });
};

export const completeBoardSprint = async (
  ctx: SprintContext,
  input: BoardSprintCompleteInput,
  client: TransactionClient = prisma,
) => {
  return executeTransaction(
    client,
    async (tx) => {
      const sprint = await ensureSprintExists(tx, ctx);
      ensureSprintCanComplete(sprint);

      const incompletedCount = await tx.boardIssue.count({
        where: {
          boardId: ctx.boardId,
          sprintId: ctx.sprintId,
          issue: { resolvedAt: null },
        },
      });

      if (incompletedCount > 0) {
        await handleIncompleteIssues(tx, ctx, input.effect);
      }

      const updated = await tx.sprint.update({
        where: { id: ctx.sprintId },
        data: { state: SPRINT_STATE.CLOSED },
      });

      // --- activity feed ---
      const project = await prisma.project.findFirst({
        where: { board: { id: ctx.boardId } },
      });
      if (project) {
        emitActivity({
          orgId: project.orgId,
          projectId: project.id,
          actorId: ctx.actorId || 'system',
          action: 'SPRINT_CLOSED',
          entity: 'SPRINT',
          entityId: ctx.sprintId,
          entityTitle: sprint.name,
          changes: [{ field: 'state', old: SPRINT_STATE.ACTIVE, new: SPRINT_STATE.CLOSED }],
        });
      }

      return updated;
    },
    { isolationLevel: 'Serializable' },
  );
};
