import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rolesService } from '../server/roles.service';
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { projectsService } from '../server/projects.service';
import { ProjectRoleCreateInput } from '@/contracts/project';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectRole: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/authz/clients/openfga', () => ({
  openfgaClient: {
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
  },
}));

vi.mock('../server/projects.service', () => ({
  projectsService: {
    getById: vi.fn(),
  },
}));

describe('rolesService', () => {
  const mockContext = { actorId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProjectRole', () => {
    it('should create role and write tuples', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);

      const input: ProjectRoleCreateInput = {
        name: 'Test Role',
        projectId: 'p1',
        description: 'Desc',
        permissions: ['kanban:manage'],
      };

      const created = {
        ...input,
        id: 'role-1',
        createdAt: new Date().toISOString(),
        actors: [], // Fix 1: Add actors array
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(prisma.projectRole.create).mockResolvedValue(created as any);

      const result = await rolesService.createProjectRole(input, mockContext);

      expect(result.id).toBe('role-1');
      expect(projectsService.getById).toHaveBeenCalledWith('p1', mockContext);
      expect(prisma.projectRole.create).toHaveBeenCalled();
      expect(openfgaClient.writeTuples).toHaveBeenCalled();
    });

    it('should use default permissions if empty', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);

      const input: ProjectRoleCreateInput = { name: 'Role', projectId: 'p1', permissions: [] };
      const created = {
        ...input,
        id: 'role-1',
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actors: [], // Fix 1
      };

      vi.mocked(prisma.projectRole.create).mockResolvedValue(created as any);

      await rolesService.createProjectRole(input, mockContext);

      expect(prisma.projectRole.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ permissions: [] }),
        }),
      );
    });
  });

  describe('deleteProjectRole', () => {
    it('should delete role and tuples', async () => {
      const role = {
        id: 'role-1',
        projectId: 'p1',
        permissions: [],
        name: 'Role 1', // Fix 2: Add name
        createdAt: new Date().toISOString(), // Fix 2: Add timestamps
        updatedAt: new Date().toISOString(),
        actors: [],
      };
      vi.mocked(prisma.projectRole.findUnique).mockResolvedValue(role as any); // for getProjectRoleById
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);

      vi.mocked(prisma.projectRole.findUniqueOrThrow).mockResolvedValue(role as any);
      vi.mocked(prisma.projectRole.delete).mockResolvedValue(role as any);

      await rolesService.deleteProjectRole('role-1', mockContext);

      expect(prisma.projectRole.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
      expect(openfgaClient.deleteTuples).toHaveBeenCalled();
    });

    it('should throw if role not found', async () => {
      vi.mocked(prisma.projectRole.findUnique).mockResolvedValue(null);

      await expect(rolesService.deleteProjectRole('role-1', mockContext)).rejects.toThrow(
        'Role not found',
      );
    });
  });

  describe('listProjectRoles', () => {
    it('should list roles', async () => {
      vi.mocked(projectsService.getById).mockResolvedValue({} as any);
      const roles = [
        {
          id: 'r1',
          name: 'R1',
          projectId: 'p1',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(), // Fix 2: Add missing fields
        },
      ];
      vi.mocked(prisma.projectRole.findMany).mockResolvedValue(roles as any);

      const result = await rolesService.listProjectRoles('p1', mockContext);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r1');
    });
  });
});
