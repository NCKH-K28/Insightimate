import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { ensureCan } from '@/features/organization/utils/authz';
import { teamsService } from '../server/teams.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/features/organization/utils/authz', () => ({
  ensureCan: vi.fn(),
}));

vi.mock('@/lib/authz/clients/openfga', () => ({
  openfgaClient: {
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
    check: vi.fn(),
    listObjects: vi.fn(),
  },
}));

describe('teamsService', () => {
  const mockCtx = { actorId: 'user-1', orgId: 'org-1' };
  const mockTeam = {
    id: 'team-1',
    name: 'Engineers',
    description: 'Devs',
    avatar: null,
    orgId: 'org-1',
    leadId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    memberships: [],
    _count: { memberships: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team if user has org read permissions', async () => {
      vi.mocked(ensureCan).mockResolvedValue(undefined);
      vi.mocked(prisma.team.create).mockResolvedValue(mockTeam as any);
      
      const input = {
        name: 'Engineers',
        description: 'Devs',
      };
      const result = await teamsService.createTeam(input, mockCtx);
      
      expect(ensureCan).toHaveBeenCalledWith('read', expect.any(Object), expect.any(Object));
      expect(prisma.team.create).toHaveBeenCalled();
      expect(openfgaClient.writeTuples).toHaveBeenCalled();
      expect(result.id).toBe('team-1');
    });

    it('should throw if ensureCan fails', async () => {
      vi.mocked(ensureCan).mockRejectedValue(new Error('Permission denied'));
      await expect(teamsService.createTeam({ name: 'Engineers' }, mockCtx)).rejects.toThrow('Permission denied');
    });
  });

  describe('getTeamById', () => {
    it('should return team if user has read', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(mockTeam as any);
      vi.mocked(openfgaClient.check).mockResolvedValue({ allowed: true } as any);
      
      const result = await teamsService.getTeamById('team-1', mockCtx);
      expect(result.id).toBe('team-1');
      expect(openfgaClient.check).toHaveBeenCalledWith(expect.objectContaining({ relation: 'read', object: 'team:team-1' }));
    });

    it('should throw if team not found or wrong org', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(null);
      await expect(teamsService.getTeamById('team-1', mockCtx)).rejects.toThrow('Team not found');
    });
  });

  describe('deleteTeamById', () => {
    it('should delete team if user has can_delete', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(mockTeam as any);
      vi.mocked(openfgaClient.check).mockResolvedValue({ allowed: true } as any);
      vi.mocked(prisma.team.delete).mockResolvedValue(mockTeam as any);

      await teamsService.deleteTeamById('team-1', mockCtx);
      expect(openfgaClient.check).toHaveBeenCalledWith(expect.objectContaining({ relation: 'can_delete' }));
      expect(prisma.team.delete).toHaveBeenCalled();
      expect(openfgaClient.deleteTuples).toHaveBeenCalled();
    });
  });
  
  describe('addMember', () => {
    it('should add member if user has can_edit', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(mockTeam as any);
      vi.mocked(openfgaClient.check).mockResolvedValue({ allowed: true } as any);
      vi.mocked(prisma.teamMember.create).mockResolvedValue({ userId: 'user-2', teamId: 'team-1' } as any);

      await teamsService.addMember('team-1', 'user-2', mockCtx);
      expect(prisma.teamMember.create).toHaveBeenCalled();
      expect(openfgaClient.writeTuples).toHaveBeenCalled();
    });
  });
});
