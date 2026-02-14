import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityEventService } from '../server/activity-event.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activityEvent: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('server-only', () => {
  return {};
});

describe('activityEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should filter events by allowed projects when provided', async () => {
      const orgId = 'org-1';
      const allowedProjectIds = ['proj-a', 'proj-b'];

      vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([]);

      await activityEventService.list({ orgId, limit: 10 }, allowedProjectIds);

      expect(prisma.activityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId,
            OR: [{ projectId: { in: allowedProjectIds } }, { projectId: null }],
          }),
          take: 11,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should not filter by allowed projects if not provided', async () => {
      const orgId = 'org-1';
      vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([]);

      // When allowedProjectIds is undefined, it assumes caller handled auth or wants all events (e.g. admin)
      await activityEventService.list({ orgId, limit: 10 });

      expect(prisma.activityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            orgId,
          },
        }),
      );
    });

    it('should handle pagination cursor', async () => {
      const orgId = 'org-1';
      const cursor = 'evt-cursor';
      vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([]);

      await activityEventService.list({ orgId, limit: 5, cursor });

      expect(prisma.activityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: cursor },
          skip: 1,
        }),
      );
    });

    it('should return nextCursor if more items found', async () => {
      const orgId = 'org-1';
      const limit = 2;
      const mockEvents = [
        { id: '1', orgId },
        { id: '2', orgId },
        { id: '3', orgId }, // Extra one
      ];
      vi.mocked(prisma.activityEvent.findMany).mockResolvedValue(mockEvents as any);

      const result = await activityEventService.list({ orgId, limit });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('2');
      expect(result.items[0].id).toBe('1');
      expect(result.items[1].id).toBe('2');
    });
  });

  describe('listForProject', () => {
    it('should query events for specific project', async () => {
      const projectId = 'proj-1';
      const orgId = 'org-1';
      vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([]);

      await activityEventService.listForProject(projectId, { orgId, limit: 10 });

      expect(prisma.activityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            orgId,
            projectId,
          },
        }),
      );
    });
  });
});
