/* eslint-disable @typescript-eslint/no-unused-vars */

import { BoardIssueCreateInput, BoardIssueUpdateInput } from '@/contracts/boards/boards.input';
import {
  BoardIssueQueryParams,
  ZBoardIssueList,
  ZBoardItem,
} from '@/contracts/boards/boards.query';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { updateIssueRank } from './cqrs/board-issue-rank';
import { moveBoardIssue } from './cqrs/board-issue-move';
import {
  completeBoardSprint,
  createBoardSprint,
  deleteBoardSprint,
  getSprintById,
  startBoardSprint,
  updateBoardSprint,
} from './cqrs/board-sprint';
import merge from 'lodash/merge';

const genIssueId = () => `is_${createId()}`;

const getById = async (id: string) => {
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      columns: { include: { statuses: true } },
      sprints: { where: { state: { not: 'CLOSED' } }, orderBy: { sequence: 'asc' } },
    },
  });
  if (!board) throw new Error('Board not found');
  return ZBoardItem.parse(board);
};

const getIssue = async (
  params: { boardId: string; issueId: string },
  context: { actorId: string },
) => {
  const boardIssue = await prisma.boardIssue.findFirst({
    where: { boardId: params.boardId, issueId: params.issueId },
    include: {
      issue: {
        include: {
          type: true,
          priority: true,
          status: true,
          reporter: true,
          resolution: true,
          assignee: true,
        },
      },
    },
  });
  if (!boardIssue) throw new Error('Board issue not found');
  return ZBoardIssueList.parse({ data: [{ ...boardIssue.issue, ...boardIssue }] }).data[0];
};

const addIssue = async (
  boardId: string,
  input: BoardIssueCreateInput,
  context: { actorId: string },
) => {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error('Board not found');
  // const issue = await prisma.boardIssue.create({
  // data: { boardId: board.id, rank: 0 },
  // });

  return prisma.$transaction(async (tx) => {
    const projectId = board.projectId;
    const {
      key: pKey,
      issueCounter,
      workspaceId,
    } = await tx.project.update({
      where: { id: board.projectId },
      data: { issueCounter: { increment: 1 } },
      select: { key: true, issueCounter: true, workspaceId: true },
    });

    const orderBy = { sequence: 'asc' } as const;
    const [type, priority, status, resolution] = await Promise.all([
      tx.issueType.findFirstOrThrow({ where: { id: input.typeId, projectId }, orderBy }),
      tx.issuePriority.findFirstOrThrow({ where: { id: input.priorityId, projectId }, orderBy }),
      tx.issueStatus.findFirstOrThrow({ where: { id: input.statusId, projectId }, orderBy }),
      tx.issueResolution.findFirst({ where: { id: input.resolutionId, projectId }, orderBy }),
    ]);

    const { sprintId, ...restInput } = input;
    const issue = await tx.issue.create({
      data: {
        ...restInput,
        id: genIssueId(),
        key: `${pKey}-${issueCounter}`,
        projectId,
        parentId: restInput.parentId ?? null, // FIXME: kiểm tra quyền
        typeId: type.id,
        priorityId: priority.id,
        resolutionId: resolution?.id,
        statusId: status.id,
        resolvedAt: status.category === 'DONE' ? new Date() : null,
        dueDate: restInput.dueDate ? new Date(restInput.dueDate) : null,
        startDate: restInput.startDate ? new Date(restInput.startDate) : null,
      },
    });

    // connect issue to board
    // FIXME: missing rank calculatio
    const boardIssue = await tx.boardIssue.create({
      data: { boardId: board.id, issueId: issue.id, rank: 0, sprintId: sprintId || null },
    });

    // create activity record for created issue
    try {
      await tx.activity.create({
        data: {
          userId: context.actorId,
          workspaceId: workspaceId || null,
          type: 'CREATED',
          sourceType: 'ISSUE',
          sourceId: issue.id,
          context: { title: issue.summary, issueKey: issue.key, projectId },
          createdBy: context.actorId,
        },
      });
    } catch (err) {
      console.log(err);
    }

    return Object.assign({}, boardIssue, issue);
  });
};

const buildIncludeOptions = (
  params: { boardId: string },
  query: BoardIssueQueryParams,
  context: { actorId: string },
): Prisma.BoardIssueInclude & { issue: { include: Prisma.IssueInclude } } => {
  const include: Prisma.BoardIssueInclude & { issue: { include: Prisma.IssueInclude } } = {
    issue: {
      include: {
        type: true,
        priority: true,
        status: true,
        reporter: true,
        resolution: true,
        assignee: true,
      },
    },
    sprint: true,
  };
  if (!query.include) return include;
  const includeInputMap = new Map<string, boolean>(query.include.map((field) => [field, true]));
  if (includeInputMap.get('status')) include.issue.include.status = true;
  if (includeInputMap.get('type')) include.issue.include.type = true;
  if (includeInputMap.get('priority')) include.issue.include.priority = true;
  if (includeInputMap.get('assignee')) include.issue.include.assignee = true;
  if (includeInputMap.get('sprint')) include.sprint = true;

  return include;
};

const listIssues = async (
  b: { id: string; type?: 'SCRUM' | 'KANBAN' },
  query: BoardIssueQueryParams,
  context: { actorId: string },
) => {
  const board = await prisma.board.findUnique({ where: { id: b.id } });
  if (!board) throw new Error('Board not found');

  // build query
  const where: Prisma.BoardIssueWhereInput = { boardId: b.id };

  // for scrum board, filter by active sprint
  if (b.type === 'SCRUM') {
    // tất cả srpint chưa close
    const closedSprints = await prisma.sprint.findMany({
      where: { boardId: b.id, state: 'CLOSED' },
    });
    const closedIds = closedSprints.map((s) => s.id);

    where.sprintId = { notIn: closedIds };
  } else if (b.type === 'KANBAN') {
    // only active sprint
    const activeSprints = await prisma.sprint.findMany({
      where: { boardId: b.id, state: 'ACTIVE' },
    });
    const ids = activeSprints.map((s) => s.id);
    if (ids.length === 0) return ZBoardIssueList.parse({ data: [] });
    where.sprintId = { in: ids };
  }

  if (query.filter?.parentId) {
    merge<typeof where, typeof where>(where, { issue: { parentId: query.filter.parentId } });
  }

  const includeOptions = buildIncludeOptions({ boardId: b.id }, query, context);
  const issues = await prisma.boardIssue.findMany({
    where,
    include: includeOptions,
    orderBy: { rank: 'asc' },
  });

  const data = issues.map(({ issue, ...rest }) => ({ ...issue, ...rest }));

  return ZBoardIssueList.parse({ data });
};

const updateIssue = async (
  params: { boardId: string; issueId: string },
  input: BoardIssueUpdateInput,
  context: { actorId: string },
) => {
  // FIXME convert to find unique (must be update in db schema)
  const boardIssue = await prisma.boardIssue.findFirst({
    where: { boardId: params.boardId, issueId: params.issueId },
    include: { issue: { select: { projectId: true } } },
  });
  if (!boardIssue) throw new Error('Board issue not found');
  const projectId = boardIssue.issue.projectId;

  const formatDate = (date: string | Date | null | undefined) => {
    if (date === null) return null;
    if (date === undefined) return undefined;
    const d = format(new Date(date), 'yyyy-MM-dd');
    return new Date(d);
  };

  if (input.statusId) {
    const status = await prisma.issueStatus.findUnique({
      where: { id: input.statusId, projectId },
      select: { category: true },
    });
    if (!status) throw new Error('Status not found');
    const category = status.category;
    Object.assign(input, { resolvedAt: category === 'DONE' ? new Date() : null }); // FIXME: non-mutable
  }

  const issue = await prisma.issue.update({
    where: { id: params.issueId, projectId },
    data: {
      ...input,
      dueDate: formatDate(input.dueDate),
      startDate: formatDate(input.startDate),
    },
  });
  if (!issue) throw new Error('Issue not found');

  // create activity for update
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    await prisma.activity.create({
      data: {
        userId: context.actorId,
        workspaceId: project?.workspaceId ?? null,
        type: 'UPDATED',
        sourceType: 'ISSUE',
        sourceId: issue.id,
        context: { title: issue.summary, issueKey: issue.key, projectId },
        createdBy: context.actorId,
      },
    });
  } catch (err) {
    console.log(err);
  }

  return { ...boardIssue, ...issue };
};

const deleteIssue = async (
  params: { boardId: string; issueId: string },
  context: { actorId: string },
) => {
  const boardIssue = await prisma.boardIssue.findFirst({
    where: { boardId: params.boardId, issueId: params.issueId },
  });
  if (!boardIssue) throw new Error('Board issue not found');

  await prisma.$transaction(async (tx) => {
    await tx.boardIssue.delete({
      where: { issueId_boardId: { issueId: params.issueId, boardId: params.boardId } },
    });
  });
};

const issueFacets = async (boardId: string, context: { actorId: string }) => {
  // FIXME: missing permission check
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error('Board not found');
  const projectId = board.projectId;

  const by = Array.from(['id', 'name', 'iconURL', 'color'] as const);
  const where = { projectId };
  const groupByArgs = { by, where, _count: { _all: true } } as const;
  const [typeRows, priorityRows, statusRows, resolutionRows] = await Promise.all([
    prisma.issueType.groupBy(groupByArgs),
    prisma.issuePriority.groupBy(groupByArgs),
    prisma.issueStatus.groupBy(groupByArgs),
    prisma.issueResolution.groupBy(groupByArgs),
  ]);

  const fieldToFacet = (field: typeof typeRows) => {
    return field.map((r) => ({ value: r.id, label: r.name, count: r._count._all }));
  };

  const data = {
    types: fieldToFacet(typeRows),
    priorities: fieldToFacet(priorityRows),
    statuses: fieldToFacet(statusRows),
    resolutions: fieldToFacet(resolutionRows),
  };

  return data;
};

export const boardsService = {
  getById,
  // == Issues
  getIssue,
  addIssue,
  listIssues,
  updateIssue,
  deleteIssue,

  issueFacets,

  updateRank: updateIssueRank,
  moveIssue: moveBoardIssue,

  // == Sprints
  getSprintById: getSprintById,
  createSprint: createBoardSprint,
  updateSprint: updateBoardSprint,
  deleteSprint: deleteBoardSprint,
  startSprint: startBoardSprint,
  completeSprint: completeBoardSprint,
};
