import { prisma } from '@/lib/prisma';
import {
  createBoardSprint,
  updateBoardSprint,
  deleteBoardSprint,
  startBoardSprint,
  completeBoardSprint,
  getSprintById,
} from '@/features/boards/server/cqrs/board-sprint';
import { sprintService as legacySprintService } from '@/features/boards/server/sprint-service';
import { projectsService } from '@/features/project_v3/server/projects.service';
import type {
  SprintCreateInput,
  SprintUpdateInput,
  SprintCompleteInput,
  SprintAddIssuesInput,
} from '@/contracts/sprints';

interface SprintContext {
  actorId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Validate that a sprint's date range does not overlap with any other
 * non-CLOSED sprint on the same board.
 *
 * @param boardId - Board to check against
 * @param startAt - Proposed start date (ISO string or null)
 * @param endAt - Proposed end date (ISO string or null)
 * @param excludeSprintId - Sprint to exclude from the check (for updates)
 */
const validateSprintDateOverlap = async (
  boardId: string,
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  excludeSprintId?: string,
): Promise<void> => {
  // Draft sprints without dates don't need overlap validation
  if (!startAt || !endAt) return;

  const start = new Date(startAt);
  const end = new Date(endAt);

  const overlapping = await prisma.sprint.findFirst({
    where: {
      boardId,
      ...(excludeSprintId ? { id: { not: excludeSprintId } } : {}),
      state: { not: 'CLOSED' },
      // Only check sprints that have dates set (ignore drafts)
      startAt: { not: null },
      endAt: { not: null },
      // Standard interval overlap: A.start <= B.end AND A.end >= B.start
      AND: [
        { startAt: { lte: end } },
        { endAt: { gte: start } },
      ],
    },
    select: { id: true, name: true, startAt: true, endAt: true },
  });

  if (overlapping) {
    throw Object.assign(
      new Error(`Sprint dates overlap with "${overlapping.name}"`),
      { code: 'SPRINT_DATE_OVERLAP', overlappingSprintId: overlapping.id },
    );
  }
};

const resolveSprintWithBoard = async (sprintId: string) => {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { board: { select: { id: true, projectId: true } } },
  });
  if (!sprint) throw Object.assign(new Error('Sprint not found'), { code: 'SPRINT_NOT_FOUND' });
  return sprint;
};

const ensureProjectAccess = async (projectId: string, ctx: SprintContext) => {
  // Reuses existing project access check (OpenFGA)
  await projectsService.getById(projectId, { actorId: ctx.actorId });
};

// ── List ─────────────────────────────────────────────────────────────────

const list = async (
  params: { boardId: string; state?: 'FUTURE' | 'ACTIVE' | 'CLOSED' },
  ctx: SprintContext,
) => {
  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    select: { id: true, projectId: true },
  });
  if (!board) throw Object.assign(new Error('Board not found'), { code: 'BOARD_NOT_FOUND' });

  await ensureProjectAccess(board.projectId, ctx);

  const where: Record<string, unknown> = { boardId: params.boardId };
  if (params.state) where.state = params.state;

  const sprints = await prisma.sprint.findMany({
    where,
    orderBy: { sequence: 'asc' },
  });

  return { data: sprints };
};

// ── List by Project ──────────────────────────────────────────────────────

const listByProject = async (
  projectId: string,
  params: { state?: 'FUTURE' | 'ACTIVE' | 'CLOSED' },
  ctx: SprintContext,
) => {
  await ensureProjectAccess(projectId, ctx);

  const board = await prisma.board.findUnique({
    where: { projectId },
    select: { id: true },
  });
  if (!board) throw Object.assign(new Error('Board not found for project'), { code: 'BOARD_NOT_FOUND' });

  return list({ boardId: board.id, state: params.state }, ctx);
};

// ── Get by ID ────────────────────────────────────────────────────────────

const getById = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await getSprintById(
    { boardId: sprint.boardId, sprintId },
    { count: { issues: true }, sum: { storyPoints: true } },
  );

  return result;
};

// ── Create ───────────────────────────────────────────────────────────────

const create = async (input: SprintCreateInput, ctx: SprintContext) => {
  const board = await prisma.board.findUnique({
    where: { id: input.boardId },
    select: { id: true, projectId: true },
  });
  if (!board) throw Object.assign(new Error('Board not found'), { code: 'BOARD_NOT_FOUND' });

  await ensureProjectAccess(board.projectId, ctx);

  // Validate no date overlap with existing sprints
  await validateSprintDateOverlap(input.boardId, input.startAt, input.endAt);

  const { boardId, ...data } = input;
  const sprint = await createBoardSprint({ boardId }, data);
  return sprint;
};

// ── Update ───────────────────────────────────────────────────────────────

const update = async (sprintId: string, input: SprintUpdateInput, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  // If dates are being changed, validate no overlap (exclude self)
  const effectiveStart = input.startAt !== undefined ? input.startAt : sprint.startAt?.toISOString() ?? null;
  const effectiveEnd = input.endAt !== undefined ? input.endAt : sprint.endAt?.toISOString() ?? null;
  await validateSprintDateOverlap(sprint.boardId, effectiveStart, effectiveEnd, sprintId);

  const updated = await updateBoardSprint(
    { boardId: sprint.boardId, sprintId },
    input,
  );
  return updated;
};

// ── Delete ───────────────────────────────────────────────────────────────

const remove = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await deleteBoardSprint({ boardId: sprint.boardId, sprintId });
  return result;
};

// ── Start ────────────────────────────────────────────────────────────────

const start = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await startBoardSprint({
    boardId: sprint.boardId,
    sprintId,
    actorId: ctx.actorId,
  });
  return result;
};

// ── Complete ─────────────────────────────────────────────────────────────

const complete = async (
  sprintId: string,
  input: SprintCompleteInput,
  ctx: SprintContext,
) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await completeBoardSprint(
    { boardId: sprint.boardId, sprintId, actorId: ctx.actorId },
    input,
  );
  return result;
};

// ── List Issues ──────────────────────────────────────────────────────────

const listIssues = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await legacySprintService.listIssues(sprintId);
  return result;
};

// ── Add Issues ───────────────────────────────────────────────────────────

const addIssues = async (
  sprintId: string,
  input: SprintAddIssuesInput,
  ctx: SprintContext,
) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  // Update board issues to belong to this sprint
  const result = await prisma.boardIssue.updateMany({
    where: {
      boardId: sprint.boardId,
      issueId: { in: input.issueIds },
    },
    data: { sprintId },
  });

  return { updated: result.count };
};

// ── Remove Issue ─────────────────────────────────────────────────────────

const removeIssue = async (
  sprintId: string,
  issueId: string,
  ctx: SprintContext,
) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await prisma.boardIssue.updateMany({
    where: {
      boardId: sprint.boardId,
      sprintId,
      issueId,
    },
    data: { sprintId: null },
  });

  return { updated: result.count };
};

// ── Reports ──────────────────────────────────────────────────────────────

const reports = async (
  sprintId: string,
  ctx: SprintContext,
  params?: { type?: 'burndown' | 'burnup' },
) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const reportType = params?.type ?? 'burndown';

  if (reportType === 'burnup') {
    const burnup = await legacySprintService.burnup(sprintId);
    return { burnup };
  }

  const burndown = await legacySprintService.burndown(sprintId);
  return { burndown };
};

// ── Summary ──────────────────────────────────────────────────────────────

const summary = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const result = await legacySprintService.summary(sprintId);
  return result;
};

// ── User Preferences ─────────────────────────────────────────────────────

const getUserPreferences = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const pref = await prisma.sprintUserPreference.findUnique({
    where: { userId_sprintId: { userId: ctx.actorId, sprintId } },
  });

  return pref ?? { filters: {}, displayProperties: {}, sortOrder: null };
};

const updateUserPreferences = async (
  sprintId: string,
  input: { filters?: unknown; displayProperties?: unknown; sortOrder?: string | null },
  ctx: SprintContext,
) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  const pref = await prisma.sprintUserPreference.upsert({
    where: { userId_sprintId: { userId: ctx.actorId, sprintId } },
    create: {
      userId: ctx.actorId,
      sprintId,
      filters: input.filters as any,
      displayProperties: input.displayProperties as any,
      sortOrder: input.sortOrder,
    },
    update: {
      ...(input.filters !== undefined && { filters: input.filters as any }),
      ...(input.displayProperties !== undefined && {
        displayProperties: input.displayProperties as any,
      }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });

  return pref;
};

// ── Analytics ────────────────────────────────────────────────────────────

type DistributionEntry = {
  id: string | null;
  count: number;
  points: number;
};

const getAnalytics = async (sprintId: string, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

  // Base filter: issues linked to this sprint
  const baseWhere = {
    boards: { some: { sprintId } },
  };

  // Assignee distribution
  const assigneeRaw = await prisma.issue.groupBy({
    by: ['assigneeId'],
    where: baseWhere,
    _count: { id: true },
    _sum: { storyPoints: true },
  });

  const assigneeDistribution: DistributionEntry[] = assigneeRaw.map((row) => ({
    id: row.assigneeId,
    count: row._count.id,
    points: row._sum.storyPoints ?? 0,
  }));

  // Status distribution
  const statusRaw = await prisma.issue.groupBy({
    by: ['statusId'],
    where: baseWhere,
    _count: { id: true },
    _sum: { storyPoints: true },
  });

  const statusDistribution: DistributionEntry[] = statusRaw.map((row) => ({
    id: row.statusId,
    count: row._count.id,
    points: row._sum.storyPoints ?? 0,
  }));

  // Priority distribution
  const priorityRaw = await prisma.issue.groupBy({
    by: ['priorityId'],
    where: baseWhere,
    _count: { id: true },
    _sum: { storyPoints: true },
  });

  const priorityDistribution: DistributionEntry[] = priorityRaw.map((row) => ({
    id: row.priorityId,
    count: row._count.id,
    points: row._sum.storyPoints ?? 0,
  }));

  // Reuse existing burndown data
  const burndown = await legacySprintService.burndown(sprintId);

  return {
    assigneeDistribution,
    statusDistribution,
    priorityDistribution,
    burndown,
  };
};

// ── Transfer Incomplete ──────────────────────────────────────────────────

const transferIncomplete = async (
  sprintId: string,
  targetSprintId: string,
  ctx: SprintContext,
) => {
  const sourceSprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sourceSprint.board.projectId, ctx);

  const targetSprint = await resolveSprintWithBoard(targetSprintId);
  // Ensure both sprints belong to the same board
  if (sourceSprint.boardId !== targetSprint.boardId) {
    throw Object.assign(
      new Error('Source and target sprints must belong to the same board'),
      { code: 'SPRINT_BOARD_MISMATCH' },
    );
  }

  // Find all board issues in source sprint whose issue status category ≠ DONE
  const boardIssues = await prisma.boardIssue.findMany({
    where: { sprintId, boardId: sourceSprint.boardId },
    include: { issue: { select: { id: true, status: { select: { category: true } } } } },
  });

  const incompleteIssueIds = boardIssues
    .filter((bi) => bi.issue.status?.category !== 'DONE')
    .map((bi) => bi.issueId);

  if (incompleteIssueIds.length === 0) {
    return { transferred: 0 };
  }

  const result = await prisma.boardIssue.updateMany({
    where: {
      boardId: sourceSprint.boardId,
      sprintId,
      issueId: { in: incompleteIssueIds },
    },
    data: { sprintId: targetSprintId },
  });

  return { transferred: result.count };
};

// ── Export ────────────────────────────────────────────────────────────────

export const sprintsService = {
  list,
  listByProject,
  getById,
  create,
  update,
  delete: remove,
  start,
  complete,
  listIssues,
  addIssues,
  removeIssue,
  reports,
  summary,
  getUserPreferences,
  updateUserPreferences,
  getAnalytics,
  transferIncomplete,
};

