import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { projectsService } from '../server/projects.service';
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { checkResourcesMapped } from '@/lib/authz/clients/cerbos';
import { ProjectCreateInput, ZProject } from '@/contracts/project';

// Mocks
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    projectRole: { createMany: vi.fn(), create: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    issuePriority: { createMany: vi.fn() },
    issueStatus: { createMany: vi.fn() },
    issueType: { createMany: vi.fn() },
    issueResolution: { createMany: vi.fn() },
    board: { create: vi.fn() },
    orgMember: { findMany: vi.fn() },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock('@/lib/authz/clients/openfga', () => ({
  openfgaClient: {
    listObjects: vi.fn(),
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
  },
}));

vi.mock('@/lib/authz/clients/cerbos', () => ({
  checkResourcesMapped: vi.fn(),
}));

describe('projectsService', () => {
  const mockContext = { actorId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const validInput: ProjectCreateInput = {
      key: 'TEST',
      name: 'Test Project',
      orgId: 'org-1',
      leadId: 'user-1',
      type: 'SOFTWARE',
      roles: [],
    };

    const mockProjectComplete = {
      id: 'proj-1',
      key: 'TEST',
      name: 'Test Project',
      orgId: 'org-1',
      leadId: 'user-1',
      type: 'SOFTWARE',
      roles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: null,
      description: null,
      boardId: 'board-1',
    };

    it('should create a project successfully', async () => {
      // Mock organization exists
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as any);

      // Mock project key check (returns null means available)
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.project.create).mockResolvedValue(mockProjectComplete as any);
      vi.mocked(prisma.project.update).mockResolvedValue({ sprintCounter: 1 } as any);

      // Mock creating related entities
      vi.mocked(prisma.projectRole.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.issuePriority.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.issueStatus.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.issueType.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.issueResolution.createMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.board.create).mockResolvedValue({ id: 'board-1' } as any);

      const result = await projectsService.create(validInput, mockContext);

      expect(result).toBeDefined();
      expect(prisma.project.create).toHaveBeenCalled();
      expect(prisma.board.create).toHaveBeenCalled(); // Default board
      expect(openfgaClient.writeTuples).toHaveBeenCalled(); // Permissions
    });

    it('should throw if leadId !== actorId', async () => {
      const input = { ...validInput, leadId: 'other-user' };
      await expect(projectsService.create(input, mockContext)).rejects.toThrow(
        'Project lead must be the actor creating the project',
      );
    });

    it('should throw if organization not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(projectsService.create(validInput, mockContext)).rejects.toThrow(
        'Organization not found',
      );
    });
  });

  describe('list', () => {
    it('should return empty list if no projects visible in OpenFGA', async () => {
      vi.mocked(openfgaClient.listObjects).mockResolvedValue({ objects: [] } as any);

      const result = await projectsService.list({ filter: { orgId: 'org-1' } }, mockContext);

      expect(result.data).toHaveLength(0);
      expect(prisma.project.findMany).not.toHaveBeenCalled();
    });

    it('should list projects visible to user', async () => {
      vi.mocked(openfgaClient.listObjects).mockResolvedValue({ objects: ['proj:proj-1'] } as any);

      const projects = [
        {
          id: 'proj-1',
          name: 'P1',
          orgId: 'org-1',
          leadId: 'user-1',
          key: 'P1',
          type: 'SOFTWARE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(prisma.project.findMany).mockResolvedValue(projects as any);

      const result = await projectsService.list({ filter: { orgId: 'org-1' } }, mockContext);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('proj-1');
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: ['proj-1'] } }),
        }),
      );
    });

    it('should include permissions if requested', async () => {
      vi.mocked(openfgaClient.listObjects).mockResolvedValue({ objects: ['proj:proj-1'] } as any);
      const projects = [
        {
          id: 'proj-1',
          name: 'P1',
          orgId: 'org-1',
          leadId: 'user-1',
          key: 'P1',
          type: 'SOFTWARE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(prisma.project.findMany).mockResolvedValue(projects as any);

      // Mock Cerbos check
      vi.mocked(checkResourcesMapped).mockResolvedValue({
        results: {
          'proj-1': { _actions: { update: true, delete: false } } as any,
        },
        raw: {} as any,
      });

      // Mock loadPrincipal finding org member (optional but good for coverage)
      vi.mocked(prisma.orgMember.findMany).mockResolvedValue([]);

      const result = await projectsService.list({ filter: { orgId: 'org-1' } }, mockContext, {
        include: { permissions: true },
      });

      expect(result.data[0].permissions).toEqual({ update: true, delete: false });
    });
  });

  describe('getById', () => {
    it('should return project if found and accessible', async () => {
      const project = {
        id: 'proj-1',
        board: { id: 'board-1' },
        key: 'P1',
        type: 'SOFTWARE',
        leadId: 'user-1',
        orgId: 'org-1',
        name: 'P1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.project.findUnique).mockResolvedValue(project as any);

      // Mock OpenFGA access check
      vi.mocked(openfgaClient.listObjects).mockResolvedValue({ objects: ['proj:proj-1'] } as any);

      const result = await projectsService.getById('proj-1', mockContext);

      expect(result.id).toBe('proj-1');
      expect(result.boardId).toBe('board-1');
    });

    it('should throw PROJECT_NOT_FOUND if not in DB', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);
      await expect(projectsService.getById('proj-1', mockContext)).rejects.toMatchObject({
        code: 'PROJECT_NOT_FOUND',
      });
    });

    it('should throw PROJECT_PERMISSION_DENIED if not in OpenFGA list', async () => {
      const project = { id: 'proj-1' };
      vi.mocked(prisma.project.findUnique).mockResolvedValue(project as any);
      vi.mocked(openfgaClient.listObjects).mockResolvedValue({ objects: [] } as any); // No objects

      await expect(projectsService.getById('proj-1', mockContext)).rejects.toMatchObject({
        code: 'PROJECT_PERMISSION_DENIED',
      });
    });
  });

  describe('update', () => {
    it('should update project if permission granted', async () => {
      const project = {
        id: 'proj-1',
        orgId: 'org-1',
        key: 'P1',
        type: 'SOFTWARE',
        leadId: 'user-1',
        name: 'P1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.project.findUnique).mockResolvedValue(project as any);

      // Mock Cerbos allow update
      vi.mocked(checkResourcesMapped).mockResolvedValue({
        results: { 'proj-1': { _actions: { update: true } } as any },
        raw: {} as any,
      });

      // Mock update
      const updated = { ...project, name: 'New Name', updatedAt: new Date() };
      vi.mocked(prisma.project.update).mockResolvedValue(updated as any);

      const result = await projectsService.update('proj-1', { name: 'New Name' }, mockContext);

      expect(result.name).toBe('New Name');
    });

    it('should throw if permission denied', async () => {
      const project = {
        id: 'proj-1',
        orgId: 'org-1',
        key: 'P1',
        type: 'SOFTWARE',
        leadId: 'user-1',
        name: 'P1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.project.findUnique).mockResolvedValue(project as any);

      // Mock Cerbos deny update
      vi.mocked(checkResourcesMapped).mockResolvedValue({
        results: { 'proj-1': { _actions: { update: false } } as any },
        raw: {} as any,
      });

      await expect(projectsService.update('proj-1', {}, mockContext)).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('delete', () => {
    it('should delete project and tuples if permission granted', async () => {
      const project = {
        id: 'proj-1',
        roles: [],
        orgId: 'org-1',
        key: 'P1',
        type: 'SOFTWARE',
        leadId: 'user-1',
        name: 'P1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.project.findUnique).mockResolvedValue(project as any);

      vi.mocked(checkResourcesMapped).mockResolvedValue({
        results: { 'proj-1': { _actions: { delete: true } } as any },
        raw: {} as any,
      });

      vi.mocked(prisma.project.delete).mockResolvedValue(project as any);

      await projectsService.delete('proj-1', mockContext);

      expect(prisma.project.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'proj-1' } }),
      );
      expect(openfgaClient.deleteTuples).toHaveBeenCalled();
    });
  });
});
