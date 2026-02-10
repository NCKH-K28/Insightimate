import { z } from 'zod';
import { ZOrganization, ZOrgInvitation } from './organization';

// logo is path (/abc/...) or null
export const ZOrgInvitee = ZOrgInvitation.pick({ email: true, role: true }).extend({
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']),
});
export const ZOrgCreateInput = ZOrganization.pick({
  name: true,
  logo: true,
  slug: true,
}).extend({ invitees: ZOrgInvitee.array().max(100).optional() });
export const ZOrgUpdateInput = ZOrganization.pick({
  slug: true,
  name: true,
  description: true,
  logo: true,
})
  .extend({ timezone: z.string() })
  .partial();

export type OrgInvitee = z.infer<typeof ZOrgInvitee>;
export type OrgCreateInput = z.infer<typeof ZOrgCreateInput>;
export type OrgUpdateInput = z.infer<typeof ZOrgUpdateInput>;

// ======== For Members
export const ZOrgMemberCreateInput = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']),
});

export const ZOrgMemberUpdateInput = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']),
});

// ======== For Invitations
export const ZOrgInvitationCreateInput = z.object({
  orgId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']),
});

export const ZOrgInvitationUpdateInput = z.object({
  id: z.string().min(1),
  role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']),
});

export const ZOrgInvitationResendInput = z.object({ id: z.string().min(1) });
export const ZOrgInvitationRevokeInput = z.object({ id: z.string().min(1) });
export const ZOrgInvitationAcceptInput = z.object({ token: z.string().min(1) });

export type OrgMemberCreateInput = z.infer<typeof ZOrgMemberCreateInput>;
export type OrgMemberUpdateInput = z.infer<typeof ZOrgMemberUpdateInput>;
export type OrgInvitationCreateInput = z.infer<typeof ZOrgInvitationCreateInput>;
