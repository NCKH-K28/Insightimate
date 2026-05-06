import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actorsService } from '../server/actors.service';
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { projectsService } from '../server/projects.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectActor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    user: { findMany: vi.fn() },
    team: { findMany: vi.fn() },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/authz/clients/openfga', () => ({
  openfgaClient: {
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
    write: vi.fn(),
  },
}));

// Mock projectsService since actorsService calls it for checks
vi.mock('../server/projects.service', () => ({
  projectsService: {
    getById: vi.fn(),
  },
}));

describe('actorsService', () => {
  const mockContext = { actorId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listProjectActors', () => {
    it('should list actors and populate user details', async () => {
      const actors = [
        { id: 'pa-1', projectId: 'p1', actorId: 'u1', actorType: 'USER', roleId: 'r1' },
      ];
      const users = [{ id: 'u1', name: 'User 1' }];

      vi.mocked(prisma.projectActor.findMany).mockResolvedValue(actors as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue(users as any);
      vi.mocked(prisma.team.findMany).mockResolvedValue([] as any);

      const result = await actorsService.listProjectActors({ projectId: 'p1' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].actor).toEqual(users[0]);
    });
  });

  describe('addProjectActor', () => {
    it('should add actor if project accessible and not exists', async () => {
      // Mock project access check
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);

      // Mock not exists
      vi.mocked(prisma.projectActor.findFirst).mockResolvedValue(null);

      // Mock create
      const created = { id: 'pa-1', projectId: 'p1', actorId: 'u1', roleId: 'r1' };
      vi.mocked(prisma.projectActor.create).mockResolvedValue(created as any);

      await actorsService.addProjectActor(
        { projectId: 'p1', actorId: 'u1', actorType: 'USER', roleId: 'r1' },
        mockContext,
      );

      expect(projectsService.getById).toHaveBeenCalledWith('p1', mockContext);
      expect(prisma.projectActor.create).toHaveBeenCalled();
      expect(openfgaClient.writeTuples).toHaveBeenCalled();
    });

    it('should throw if actor already exists', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      vi.mocked(prisma.projectActor.findFirst).mockResolvedValue({ id: 'pa-1' } as any);

      await expect(
        actorsService.addProjectActor(
          { projectId: 'p1', actorId: 'u1', actorType: 'USER', roleId: 'r1' },
          mockContext,
        ),
      ).rejects.toMatchObject({ code: 'PROJECT_ALREADY_EXISTS' });
    });
  });

  describe('removeProjectActor', () => {
    it('should remove actor if exists', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      const actor = { id: 'pa-1', projectId: 'p1' };
      vi.mocked(prisma.projectActor.findUnique).mockResolvedValue(actor as any);
      vi.mocked(prisma.projectActor.delete).mockResolvedValue(actor as any);

      await actorsService.removeProjectActor({ projectId: 'p1', actorId: 'pa-1' }, mockContext);

      expect(prisma.projectActor.delete).toHaveBeenCalled();
      expect(openfgaClient.deleteTuples).toHaveBeenCalled();
    });

    it('should throw if actor not found', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      vi.mocked(prisma.projectActor.findUnique).mockResolvedValue(null);

      await expect(
        actorsService.removeProjectActor({ projectId: 'p1', actorId: 'pa-1' }, mockContext),
      ).rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND' });
    });

    it('should throw if actor does not belong to project', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      const actor = { id: 'pa-1', projectId: 'other-p' };
      vi.mocked(prisma.projectActor.findUnique).mockResolvedValue(actor as any);

      await expect(
        actorsService.removeProjectActor({ projectId: 'p1', actorId: 'pa-1' }, mockContext),
      ).rejects.toMatchObject({ code: 'PROJECT_INVALID_INPUT' });
    });
  });

  describe('updateProjectActor', () => {
    it('should update role and sync tuples', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      const actor = { id: 'pa-1', projectId: 'p1', roleId: 'old-role' };
      vi.mocked(prisma.projectActor.findUnique).mockResolvedValue(actor as any);

      const updated = { ...actor, roleId: 'new-role' };
      vi.mocked(prisma.projectActor.update).mockResolvedValue(updated as any);

      await actorsService.updateProjectActor(
        { projectId: 'p1', actorId: 'pa-1', roleId: 'new-role' },
        mockContext,
      );

      expect(openfgaClient.write).toHaveBeenCalled(); // write new, delete old
    });
  });
});
