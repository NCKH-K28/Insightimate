import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orgService } from './org.service';
import { prisma } from '@/lib/prisma';
import { ensureCan, accessibleOrgs, allowedOrgPerms } from '../utils/authz';
import { openfgaClient } from '@/lib/authz/clients';
import { orgInvitationService } from './org-invitation.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orgMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../utils/authz', () => ({
  ensureCan: vi.fn(),
  accessibleOrgs: vi.fn(),
  allowedOrgPerms: vi.fn(),
}));

vi.mock('@/lib/authz/clients', () => ({
  openfgaClient: {
    writeTuples: vi.fn(),
  },
}));

vi.mock('./org-invitation.service', () => ({
  orgInvitationService: {
    bulkInvite: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../utils/id', () => ({
  genOrgId: () => 'org-new',
}));

describe('OrgService', () => {
  const mockCtx = { actorId: 'user-1' };
  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    ownerId: 'user-1',
    logo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create org, write tuples, and bulk invite', async () => {
      const input = {
        name: 'New Org',
        slug: 'new-org',
        ownerId: 'user-1',
        invitees: [{ email: 'test@test.com', role: 'ORG_MEMBER' as const }],
      };

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null); // No slug conflict
      vi.mocked(prisma.organization.create).mockResolvedValue({ ...mockOrg, id: 'org-new' } as any);

      const result = await orgService.create(input, mockCtx);

      expect(prisma.organization.create).toHaveBeenCalled();
      expect(openfgaClient.writeTuples).toHaveBeenCalled();
      expect(orgInvitationService.bulkInvite).toHaveBeenCalled();
      expect(result.id).toBe('org-new');
    });

    it('should throw if slug exists', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any); // Slug conflict

      const input = { name: 'New Org', slug: 'test-org', ownerId: 'user-1' };

      await expect(orgService.create(input, mockCtx)).rejects.toThrow(
        'Organization slug already exists',
      );
    });
  });

  describe('get', () => {
    it('should return org with permissions', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(ensureCan).mockResolvedValue(undefined);
      vi.mocked(prisma.orgMember.findUnique).mockResolvedValue({ role: 'ORG_OWNER' } as any);
      vi.mocked(allowedOrgPerms).mockResolvedValue(['update', 'delete']);

      const result = await orgService.get({ id: 'org-1' }, mockCtx);

      expect(result.id).toBe('org-1');
      expect(result._me.role).toBe('ORG_OWNER');
      expect(result._me.perms).toEqual(['update', 'delete']);
    });
  });

  describe('list', () => {
    it('should return list of orgs', async () => {
      vi.mocked(accessibleOrgs).mockResolvedValue(['org-1', 'org-2']);
      vi.mocked(prisma.organization.findMany).mockResolvedValue([mockOrg]);
      vi.mocked(prisma.organization.count).mockResolvedValue(1);
      vi.mocked(prisma.orgMember.findMany).mockResolvedValue([
        { orgId: 'org-1', role: 'ORG_OWNER' },
      ] as any);

      const result = await orgService.list(null, mockCtx);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]._me.role).toBe('ORG_OWNER');
    });

    it('should return empty if no accessible orgs', async () => {
      vi.mocked(accessibleOrgs).mockResolvedValue([]);
      const result = await orgService.list(null, mockCtx);
      expect(result.data).toHaveLength(0);
    });
  });
});
