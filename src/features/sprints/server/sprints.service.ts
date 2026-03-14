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

  const { boardId, ...data } = input;
  const sprint = await createBoardSprint({ boardId }, data);
  return sprint;
};

// ── Update ───────────────────────────────────────────────────────────────

const update = async (sprintId: string, input: SprintUpdateInput, ctx: SprintContext) => {
  const sprint = await resolveSprintWithBoard(sprintId);
  await ensureProjectAccess(sprint.board.projectId, ctx);

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

// ── Export ────────────────────────────────────────────────────────────────

export const sprintsService = {
  list,
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
};
