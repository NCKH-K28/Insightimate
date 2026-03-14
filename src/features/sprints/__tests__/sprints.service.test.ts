import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sprintsService } from '../server/sprints.service';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    sprint: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    board: {
      findUnique: vi.fn(),
    },
    boardIssue: {
      updateMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

vi.mock('@/features/boards/server/cqrs/board-sprint', () => ({
  createBoardSprint: vi.fn(),
  updateBoardSprint: vi.fn(),
  deleteBoardSprint: vi.fn(),
  startBoardSprint: vi.fn(),
  completeBoardSprint: vi.fn(),
  getSprintById: vi.fn(),
}));

vi.mock('@/features/boards/server/sprint-service', () => ({
  sprintService: {
    listIssues: vi.fn(),
    burndown: vi.fn(),
    burnup: vi.fn(),
    summary: vi.fn(),
  },
}));

vi.mock('@/features/project_v3/server/projects.service', () => ({
  projectsService: {
    getById: vi.fn(),
  },
}));

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

// ── Helpers ──────────────────────────────────────────────────────────────

const ctx = { actorId: 'user-1' };

const mockSprint = {
  id: 'sp_test1',
  name: 'Sprint 1',
  state: 'FUTURE',
  boardId: 'board-1',
  sequence: 0,
  startAt: null,
  endAt: null,
  goal: null,
  committedPoints: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  board: { id: 'board-1', projectId: 'proj-1' },
};

const mockBoard = { id: 'board-1', projectId: 'proj-1' };

// ── Tests ────────────────────────────────────────────────────────────────

describe('sprintsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: project access always succeeds
    vi.mocked(projectsService.getById).mockResolvedValue({} as any);
  });

  describe('list', () => {
    it('should list sprints for a board', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(mockBoard as any);
      vi.mocked(prisma.sprint.findMany).mockResolvedValue([mockSprint] as any);

      const result = await sprintsService.list({ boardId: 'board-1' }, ctx);

      expect(result.data).toHaveLength(1);
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        select: { id: true, projectId: true },
      });
      expect(projectsService.getById).toHaveBeenCalledWith('proj-1', { actorId: 'user-1' });
    });

    it('should throw if board not found', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(null);

      await expect(sprintsService.list({ boardId: 'bad-id' }, ctx)).rejects.toMatchObject({
        code: 'BOARD_NOT_FOUND',
      });
    });

    it('should filter by state', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(mockBoard as any);
      vi.mocked(prisma.sprint.findMany).mockResolvedValue([]);

      await sprintsService.list({ boardId: 'board-1', state: 'ACTIVE' }, ctx);

      expect(prisma.sprint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 'board-1', state: 'ACTIVE' },
        }),
      );
    });
  });

  describe('getById', () => {
    it('should get sprint with aggregations', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const mockResult = { ...mockSprint, _aggregations: {} };
      vi.mocked(getSprintById).mockResolvedValue(mockResult as any);

      const result = await sprintsService.getById('sp_test1', ctx);

      expect(result).toEqual(mockResult);
      expect(projectsService.getById).toHaveBeenCalledWith('proj-1', { actorId: 'user-1' });
    });

    it('should throw if sprint not found', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(null);

      await expect(sprintsService.getById('bad-id', ctx)).rejects.toMatchObject({
        code: 'SPRINT_NOT_FOUND',
      });
    });
  });

  describe('create', () => {
    it('should create a sprint', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(mockBoard as any);
      const newSprint = { ...mockSprint, id: 'sp_new' };
      vi.mocked(createBoardSprint).mockResolvedValue(newSprint as any);

      const result = await sprintsService.create(
        { boardId: 'board-1', name: 'New Sprint' },
        ctx,
      );

      expect(result.id).toBe('sp_new');
      expect(createBoardSprint).toHaveBeenCalledWith(
        { boardId: 'board-1' },
        { name: 'New Sprint' },
      );
    });

    it('should throw if board not found', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(null);

      await expect(
        sprintsService.create({ boardId: 'bad-id' }, ctx),
      ).rejects.toMatchObject({ code: 'BOARD_NOT_FOUND' });
    });
  });

  describe('update', () => {
    it('should update a sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const updatedSprint = { ...mockSprint, name: 'Updated' };
      vi.mocked(updateBoardSprint).mockResolvedValue(updatedSprint as any);

      const result = await sprintsService.update('sp_test1', { name: 'Updated' }, ctx);

      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should delete a sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(deleteBoardSprint).mockResolvedValue({ success: true });

      const result = await sprintsService.delete('sp_test1', ctx);

      expect(result.success).toBe(true);
    });
  });

  describe('start', () => {
    it('should start a sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const started = { ...mockSprint, state: 'ACTIVE' };
      vi.mocked(startBoardSprint).mockResolvedValue(started as any);

      const result = await sprintsService.start('sp_test1', ctx);

      expect(result.state).toBe('ACTIVE');
      expect(startBoardSprint).toHaveBeenCalledWith({
        boardId: 'board-1',
        sprintId: 'sp_test1',
        actorId: 'user-1',
      });
    });
  });

  describe('complete', () => {
    it('should complete a sprint with effect', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const completed = { ...mockSprint, state: 'CLOSED' };
      vi.mocked(completeBoardSprint).mockResolvedValue(completed as any);

      const result = await sprintsService.complete(
        'sp_test1',
        { effect: 'to:backlog' },
        ctx,
      );

      expect(result.state).toBe('CLOSED');
    });
  });

  describe('listIssues', () => {
    it('should list issues in sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const issues = { data: [{ id: 'issue-1' }], meta: { total: 1 } };
      vi.mocked(legacySprintService.listIssues).mockResolvedValue(issues as any);

      const result = await sprintsService.listIssues('sp_test1', ctx);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('addIssues', () => {
    it('should add issues to sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.boardIssue.updateMany).mockResolvedValue({ count: 2 });

      const result = await sprintsService.addIssues(
        'sp_test1',
        { issueIds: ['issue-1', 'issue-2'] },
        ctx,
      );

      expect(result.updated).toBe(2);
    });
  });

  describe('removeIssue', () => {
    it('should remove issue from sprint', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.boardIssue.updateMany).mockResolvedValue({ count: 1 });

      const result = await sprintsService.removeIssue('sp_test1', 'issue-1', ctx);

      expect(result.updated).toBe(1);
    });
  });

  describe('reports', () => {
    it('should return burndown report by default', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const burndown = { type: 'burndown', series: [] };
      vi.mocked(legacySprintService.burndown).mockResolvedValue(burndown as any);

      const result = await sprintsService.reports('sp_test1', ctx);

      expect(result).toHaveProperty('burndown');
    });

    it('should return burnup report when requested', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const burnup = { type: 'burnup', series: [] };
      vi.mocked(legacySprintService.burnup).mockResolvedValue(burnup as any);

      const result = await sprintsService.reports('sp_test1', ctx, { type: 'burnup' });

      expect(result).toHaveProperty('burnup');
    });
  });

  describe('summary', () => {
    it('should return sprint summary', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      const summary = { id: 'sp_test1', name: 'Sprint 1', metrics: {} };
      vi.mocked(legacySprintService.summary).mockResolvedValue(summary as any);

      const result = await sprintsService.summary('sp_test1', ctx);

      expect(result.id).toBe('sp_test1');
    });
  });
});
