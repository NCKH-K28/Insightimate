import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { transporter } from '@/lib/mail-sender';
import { ensureCan, ensureCanMany } from '../utils/authz';
import { inviteToken } from '../server/invite-token';
import { orgMemberService } from '../server/org-member.service';
import { orgInvitationService } from '../server/org-invitation.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    orgInvitation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    orgMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../server/invite-token', () => ({
  inviteToken: {
    generate: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('../server/org-member.service', () => ({
  orgMemberService: {
    add: vi.fn(),
  },
}));

vi.mock('@/lib/mail-sender', () => ({
  transporter: {
    sendMail: vi.fn(),
  },
}));

vi.mock('../utils/authz', () => ({
  ensureCan: vi.fn(),
  ensureCanMany: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock config
vi.mock('@/configs/server', () => ({
  default: {
    appURL: 'http://localhost:3000',
    jwt: { inviteSecret: 'secret' },
    cerbos: { apiURL: 'http://localhost:3592' },
    openFGA: { apiURL: 'http://localhost:8080', storeID: '01H4MK430V7K0H2VF1N0000000' },
  },
}));

describe('OrgInvitationService', () => {
  const mockCtx = { actorId: 'user-1' };
  const mockOrg = { id: 'org-1', name: 'Test Org', ownerId: 'owner-1' };
  const mockInviter = { id: 'user-1', name: 'Inviter', email: 'inviter@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('accept', () => {
    it('should accept invitation and add member when valid', async () => {
      const token = 'valid-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token: 'valid-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000), // Valid
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);
      vi.mocked(prisma.orgInvitation.update).mockResolvedValue(inviteData as any);
      vi.mocked(orgMemberService.add).mockResolvedValue({} as any);

      await orgInvitationService.accept({ token }, mockCtx);

      expect(inviteToken.verify).toHaveBeenCalledWith(token);
      expect(prisma.orgInvitation.update).toHaveBeenCalledWith({
        where: { orgId_email: { orgId: 'org-1', email: 'test@test.com' } },
        data: expect.objectContaining({ status: 'ACCEPTED' }),
      });
      expect(orgMemberService.add).toHaveBeenCalledWith(
        { orgId: 'org-1', userId: 'user-1', role: 'ORG_MEMBER' },
        mockCtx,
        expect.anything(),
      );
    });

    it('should throw if expired', async () => {
      const token = 'expired-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token,
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 100000), // Expired
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await expect(orgInvitationService.accept({ token }, mockCtx)).rejects.toThrow(
        'Invitation has expired',
      );
    });

    it('should throw if token mismatch', async () => {
      const token = 'tampered-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token: 'original-token', // DIFFERENT
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await expect(orgInvitationService.accept({ token }, mockCtx)).rejects.toThrow(
        'Invalid invitation token',
      );
    });
  });

  describe('resend', () => {
    it('should resend existing token if valid', async () => {
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token: 'existing-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000), // Valid
      };

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockInviter as any);

      await orgInvitationService.resend({ orgId: 'org-1', email: 'test@test.com' }, mockCtx);

      // Should NOT generate new token
      expect(inviteToken.generate).not.toHaveBeenCalled();
      // Should send mail
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          html: expect.stringContaining('existing-token'), // Verify link contains token
        }),
      );
    });

    it('should generate new token if expired', async () => {
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token: 'expired-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 100000), // Expired
      };
      const newToken = 'new-token';

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockInviter as any);

      // Mock token generation
      vi.mocked(inviteToken.generate).mockResolvedValue(newToken);
      // Mock update returns updated invite for email sending
      vi.mocked(prisma.orgInvitation.update).mockResolvedValue({
        ...inviteData,
        token: newToken,
        expiresAt: new Date(Date.now() + 100000),
      } as any);

      await orgInvitationService.resend({ orgId: 'org-1', email: 'test@test.com' }, mockCtx);

      expect(inviteToken.generate).toHaveBeenCalled();
      expect(prisma.orgInvitation.update).toHaveBeenCalled();
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(newToken),
        }),
      );
    });
  });

  describe('reject', () => {
    it('should reject a valid pending invitation', async () => {
      const token = 'valid-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await orgInvitationService.reject({ token }, mockCtx);

      expect(prisma.orgInvitation.updateMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1', email: 'test@test.com', status: 'PENDING' },
        data: expect.objectContaining({ status: 'REJECTED', rejectedAt: expect.any(Date) }),
      });
    });

    it('should throw if invitation is expired', async () => {
      const token = 'expired-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token,
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 100000),
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await expect(orgInvitationService.reject({ token }, mockCtx)).rejects.toThrow(
        'Invitation has expired',
      );
    });

    it('should throw if invitation is already accepted', async () => {
      const token = 'accepted-token';
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_MEMBER',
        token,
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.mocked(inviteToken.verify).mockResolvedValue({
        sub: 'org-1',
        email: 'test@test.com',
      } as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await expect(orgInvitationService.reject({ token }, mockCtx)).rejects.toThrow(
        'Invitation already accepted',
      );
    });
  });

  describe('revoke', () => {
    it('should revoke a pending invitation with correct role-based permission check', async () => {
      const inviteData = {
        orgId: 'org-1',
        email: 'test@test.com',
        role: 'ORG_ADMIN',
        token: 'some-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(inviteData as any);

      await orgInvitationService.revoke({ orgId: 'org-1', email: 'test@test.com' }, mockCtx);

      // Should check permission for the invite's actual role (ORG_ADMIN), not hardcoded ORG_MEMBER
      expect(ensureCan).toHaveBeenCalledWith(
        'members:manage#admin',
        expect.objectContaining({ id: 'org-1', kind: 'org' }),
        mockCtx,
      );
      expect(prisma.orgInvitation.updateMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1', email: 'test@test.com', status: 'PENDING' },
        data: expect.objectContaining({ status: 'REVOKED', revokedAt: expect.any(Date) }),
      });
    });

    it('should throw if invitation not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.orgInvitation.findUnique).mockResolvedValue(null);

      await expect(
        orgInvitationService.revoke({ orgId: 'org-1', email: 'unknown@test.com' }, mockCtx),
      ).rejects.toThrow('Invitation not found');
    });
  });

  describe('bulkInvite', () => {
    it('should deduplicate invitees by email (last wins)', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockInviter as any);
      vi.mocked(inviteToken.generate).mockResolvedValue('bulk-token');
      vi.mocked(prisma.orgInvitation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.orgMember.findMany).mockResolvedValue([]);
      vi.mocked(prisma.orgInvitation.create).mockResolvedValue({} as any);

      const result = await orgInvitationService.bulkInvite(
        {
          orgId: 'org-1',
          invitees: [
            { email: 'dup@test.com', role: 'ORG_MEMBER' },
            { email: 'dup@test.com', role: 'ORG_ADMIN' }, // last wins
          ],
        },
        mockCtx,
      );

      // Should only have 1 result (deduplicated)
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({
        email: 'dup@test.com',
        role: 'ORG_ADMIN',
        outcome: 'SENT',
      });
    });

    it('should handle mixed outcomes (new, existing valid, already accepted)', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockInviter as any);
      vi.mocked(inviteToken.generate).mockResolvedValue('bulk-token');
      vi.mocked(prisma.orgInvitation.findMany).mockResolvedValue([
        { email: 'existing@test.com', status: 'PENDING', expiresAt: new Date(Date.now() + 100000) },
        { email: 'accepted@test.com', status: 'ACCEPTED', expiresAt: new Date(Date.now() + 100000) },
      ] as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-2', email: 'accepted@test.com' },
      ] as any);
      vi.mocked(prisma.orgMember.findMany).mockResolvedValue([
        { userId: 'user-2', orgId: 'org-1' },
      ] as any);
      vi.mocked(prisma.orgInvitation.create).mockResolvedValue({} as any);

      const result = await orgInvitationService.bulkInvite(
        {
          orgId: 'org-1',
          invitees: [
            { email: 'new@test.com', role: 'ORG_MEMBER' },
            { email: 'existing@test.com', role: 'ORG_MEMBER' },
            { email: 'accepted@test.com', role: 'ORG_MEMBER' },
          ],
        },
        mockCtx,
      );

      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'new@test.com', outcome: 'SENT', reason: 'CREATED' }),
          expect.objectContaining({ email: 'existing@test.com', outcome: 'SKIPPED', reason: 'EXISTS_VALID' }),
          expect.objectContaining({ email: 'accepted@test.com', outcome: 'ERROR', reason: 'ALREADY_ACCEPTED' }),
        ]),
      );
    });
  });
});

