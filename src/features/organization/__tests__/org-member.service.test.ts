import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ensureCan, allowedOrgsPerms } from '../utils/authz';
import { enqueueFgaJob } from '../server/enqueue-fga-job';
import { orgMemberService } from '../server/org-member.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    orgMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    authzOutbox: {
      create: vi.fn(),
    },
    orgInvitation: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
  executeTransaction: vi.fn((client, callback) => callback(client)),
}));

vi.mock('../utils/authz', () => ({
  allowedOrgsPerms: vi.fn(),
  ensureCan: vi.fn(),
}));

vi.mock('../server/enqueue-fga-job', () => ({
  enqueueFgaJob: vi.fn(),
  processFgaJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/authz/clients', () => ({
  openfgaClient: {
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
  },
  cerbosClient: {
    checkResource: vi.fn(),
    checkResources: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('OrgMemberService', () => {
  const mockCtx = { actorId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return member list with permissions', async () => {
      const mockMembers = [
        { id: 'mem-1', orgId: 'org-1', userId: 'user-1', role: 'ORG_ADMIN', createdAt: new Date() },
      ];
      vi.mocked(prisma.orgMember.findMany).mockResolvedValue(mockMembers as any);
      vi.mocked(allowedOrgsPerms).mockResolvedValue({ 'mem-1': ['delete'] });

      const result = await orgMemberService.list({ orgId: 'org-1' }, mockCtx);

      expect(prisma.orgMember.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result.data[0]._me.perms).toEqual(['delete']);
    });
  });

  describe('remove', () => {
    it('should remove member and enqueue FGA job', async () => {
      const mockMember = { id: 'mem-1', orgId: 'org-1', userId: 'user-2', role: 'ORG_MEMBER' };
      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue(mockMember as any);
      vi.mocked(prisma.orgMember.delete).mockResolvedValue(mockMember as any);
      vi.mocked(enqueueFgaJob).mockResolvedValue({ id: 'job-1' } as any);

      const result = await orgMemberService.remove({ orgId: 'org-1', userId: 'user-2' }, mockCtx);

      expect(prisma.orgMember.delete).toHaveBeenCalled();
      expect(enqueueFgaJob).toHaveBeenCalledWith(expect.anything(), {
        kind: 'org_member_remove',
        member: mockMember,
      });
      expect(result).toEqual({ ok: true, fgaJobId: 'job-1' });
    });
  });

  describe('assign', () => {
    it('should update role and enqueue FGA job', async () => {
      const mockOrg = { id: 'org-1', ownerId: 'user-1' };
      const mockMember = { id: 'mem-1', orgId: 'org-1', userId: 'user-2', role: 'ORG_MEMBER' };
      const updatedMember = { ...mockMember, role: 'ORG_ADMIN' };

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(ensureCan).mockResolvedValue(undefined);
      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue(mockMember as any);
      vi.mocked(prisma.orgMember.update).mockResolvedValue(updatedMember as any);
      vi.mocked(enqueueFgaJob).mockResolvedValue({ id: 'job-1' } as any);

      const result = await orgMemberService.assign(
        { orgId: 'org-1', userId: 'user-2', role: 'ORG_ADMIN' },
        mockCtx,
      );

      expect(ensureCan).toHaveBeenCalledWith(
        'members:manage#admin',
        expect.objectContaining({ id: 'org-1' }),
        mockCtx,
      );
      expect(prisma.orgMember.update).toHaveBeenCalled();
      expect(enqueueFgaJob).toHaveBeenCalledWith(expect.anything(), {
        kind: 'org_member_assign',
        oldMember: mockMember,
        newMember: updatedMember,
      });
      expect(result).toEqual(updatedMember);
    });
  });

  describe('add', () => {
    it('should add member and enqueue FGA job', async () => {
      const newMember = { id: 'mem-new', orgId: 'org-1', userId: 'user-new', role: 'ORG_MEMBER' };

      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.orgMember.create).mockResolvedValue(newMember as any);
      vi.mocked(enqueueFgaJob).mockResolvedValue({ id: 'job-1' } as any);

      const result = await orgMemberService.add(
        { orgId: 'org-1', userId: 'user-new', role: 'ORG_MEMBER' },
        mockCtx,
      );

      expect(prisma.orgMember.create).toHaveBeenCalled();
      expect(enqueueFgaJob).toHaveBeenCalledWith(expect.anything(), {
        kind: 'org_member_add',
        member: newMember,
      });
      expect(result).toEqual(newMember);
    });
  });

  describe('leave', () => {
    it('should remove member and invites', async () => {
      const member = {
        id: 'mem-1',
        userId: 'user-1',
        orgId: 'org-1',
        user: { email: 'test@test.com' },
        role: 'ORG_MEMBER',
      };

      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue(member as any);
      vi.mocked(prisma.orgMember.delete).mockResolvedValue(member as any);
      vi.mocked(enqueueFgaJob).mockResolvedValue({ id: 'job-1' } as any);

      // input userId matches actorId (user-1)
      await orgMemberService.leave({ orgId: 'org-1', userId: 'user-1' }, mockCtx);

      expect(prisma.orgMember.findUnique).toHaveBeenCalledWith({
        where: { orgId_userId: { orgId: 'org-1', userId: 'user-1' } },
        include: { user: true },
      });
      expect(prisma.orgMember.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orgId_userId: { orgId: 'org-1', userId: 'user-1' } } }),
      );
      expect(prisma.orgInvitation.deleteMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1', email: 'test@test.com' },
      });
      expect(enqueueFgaJob).toHaveBeenCalled();
    });

    it('should throw if user tries to leave for another user', async () => {
      await expect(
        orgMemberService.leave({ orgId: 'org-1', userId: 'user-2' }, mockCtx),
      ).rejects.toThrow('Cannot leave organization on behalf of another user');
    });

    it('should throw if user is ORG_OWNER', async () => {
      const member = {
        id: 'mem-owner',
        userId: 'user-1',
        orgId: 'org-1',
        user: { email: 'owner@test.com' },
        role: 'ORG_OWNER',
      };

      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue(member as any);

      await expect(
        orgMemberService.leave({ orgId: 'org-1', userId: 'user-1' }, mockCtx),
      ).rejects.toThrow('Owner cannot leave the organization.');
    });
  });
});
