/* eslint-disable @typescript-eslint/no-unused-vars */

import { BoardIssueCreateInput, BoardIssueUpdateInput } from '@/contracts/boards/board.input';
import {
  BoardIssueQueryParams,
  ZBoardColumnList,
  ZBoardIssueList,
  ZBoardItem,
} from '@/contracts/boards/board.query';
import { prisma } from '@/lib/prisma';
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
import { genIssueId } from '@/features/project/configs/id-generators';
import { emitActivity } from '@/features/activity/server/emit-activity';

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

const listColumns = async (boardId: string) => {
  const columns = await prisma.boardColumn.findMany({
    where: { boardId },
    include: { statuses: { include: { status: true } } },
    orderBy: { sequence: 'asc' },
  });

  const mappedColumns = columns.map(({ statuses, ...col }) => ({
    statuses: statuses.map(({ status }) => status),
    ...col,
  }));

  return ZBoardColumnList.parse({ data: mappedColumns, meta: {} });
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
          parent: { select: { id: true, key: true, summary: true, type: true } },
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
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: true },
  });
  if (!board) throw new Error('Board not found');

  if (input.sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: input.sprintId, boardId: board.id },
    });
    if (!sprint) throw new Error('Sprint not found in this board');
  }

  return prisma.$transaction(async (tx) => {
    const projectId = board.projectId;
    if (!projectId) throw new Error('Project not found');
    const { key: pKey, issueCounter } = await tx.project.update({
      where: { id: board.projectId },
      data: { issueCounter: { increment: 1 } },
      select: { key: true, issueCounter: true },
    });

    let hierarchy: number | undefined = undefined;
    if (input.parentId) {
      const parentIssue = await tx.issue.findUnique({
        where: { id: input.parentId, projectId },
        select: { id: true, type: { select: { hierarchy: true } } },
      });
      if (!parentIssue) throw new Error('Parent issue not found');
      hierarchy = parentIssue.type.hierarchy - 1;
      if (hierarchy < 0) throw new Error('Cannot create sub-task for sub-task');
    }

    const orderBy = { sequence: 'asc' } as const;
    const [type, priority, status, resolution] = await Promise.all([
      tx.issueType.findFirstOrThrow({
        where: { id: input.typeId, projectId, hierarchy },
        orderBy,
      }),
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
        parentId: restInput.parentId ?? null,
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

    // --- activity feed (v2) ---
    emitActivity({
      orgId: board.project.orgId || '', // FIXME: project->org relation should be loaded
      projectId,
      actorId: context.actorId,
      action: 'CREATED',
      entity: 'ISSUE',
      entityId: issue.id,
      entityKey: issue.key,
      entityTitle: issue.summary,
      metadata: { issueType: type.name, priority: priority.name },
    });

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

  if (query.filter?.issueType) {
    if (query.filter.issueType.hierarchy !== undefined) {
      merge<typeof where, typeof where>(where, {
        issue: { type: { hierarchy: query.filter.issueType.hierarchy } },
      });
    }
  }

  const includeOptions = buildIncludeOptions({ boardId: b.id }, query, context);
  const issues = await prisma.boardIssue.findMany({
    where,
    include: includeOptions,
    orderBy: { rank: 'asc' },
  });

  // count children done
  const childrenDones = await Promise.all(
    issues.map(async (issue) => {
      const subWhere = { boardId: b.id, issue: { parentId: issue.issueId } };
      const total = await prisma.boardIssue.count({ where: subWhere });
      const done = await prisma.boardIssue.count({
        where: { boardId: b.id, issue: { parentId: issue.issueId, resolvedAt: { not: null } } },
      });
      return { id: issue.issueId, total, done };
    }),
  );

  const childrenDoneMap = new Map(childrenDones.map((d) => [d.id, d]));
  const data = issues.map(({ issue, ...rest }) => {
    const childrenDone = childrenDoneMap.get(issue.id);
    return { ...issue, ...rest, _children: childrenDone };
  });

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

  // --- activity feed (v2) ---
  const changes: Record<string, any>[] = [];
  if (input.summary) changes.push({ field: 'summary', new: input.summary });
  if (input.statusId) changes.push({ field: 'statusId', new: input.statusId });
  if (input.priorityId) changes.push({ field: 'priorityId', new: input.priorityId });
  if (input.assigneeId) changes.push({ field: 'assigneeId', new: input.assigneeId });

  if (changes.length > 0) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      emitActivity({
        orgId: project.orgId,
        projectId,
        actorId: context.actorId,
        action: 'UPDATED',
        entity: 'ISSUE',
        entityId: issue.id,
        entityKey: issue.key,
        entityTitle: issue.summary,
        changes,
      });
    }
  }

  return { ...boardIssue, ...issue };
};

const deleteIssue = async (
  params: { boardId: string; issueId: string },
  context: { actorId: string },
) => {
  const boardIssue = await prisma.boardIssue.findFirst({
    where: { boardId: params.boardId, issueId: params.issueId },
    include: {
      issue: { select: { id: true, key: true, summary: true, projectId: true } },
      board: { include: { project: true } },
    },
  });
  if (!boardIssue) throw new Error('Board issue not found');

  await prisma.$transaction(async (tx) => {
    // --- activity feed (v2) ---
    emitActivity({
      orgId: boardIssue.board.project.orgId,
      projectId: boardIssue.issue.projectId,
      actorId: context.actorId,
      action: 'DELETED',
      entity: 'ISSUE',
      entityId: params.issueId,
      entityKey: boardIssue.issue.key,
      entityTitle: boardIssue.issue.summary,
    });

    await tx.boardIssue.delete({
      where: { issueId: params.issueId },
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
  listColumns,
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
