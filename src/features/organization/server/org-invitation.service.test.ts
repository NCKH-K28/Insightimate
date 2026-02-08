import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orgInvitationService } from './org-invitation.service';
import { prisma } from '@/lib/prisma';
import { inviteToken } from './invite-token';
import { orgMemberService } from './org-member.service';
import { transporter } from '@/lib/mail-sender';
import { ensureCan, ensureCanMany } from '../utils/authz';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    orgInvitation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('./invite-token', () => ({
  inviteToken: {
    generate: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('./org-member.service', () => ({
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

// Mock config
vi.mock('@/configs/server', () => ({
  default: {
    appURL: 'http://localhost:3000',
    jwt: { inviteSecret: 'secret' },
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
});
