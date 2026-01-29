import { z } from 'zod';
import { ZOrgActions, ZOrganization, ZOrgInvitation, ZOrgMember, ZOrgRole } from './organization';

export const ZOrgPermissions = z.record(z.string(), z.boolean());
export const ZPublicUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
});

export const ZOrgItem = ZOrganization.extend({
  owner: ZPublicUser.optional(),

  // == System Extended Fields ==
  _count: z.object({ members: z.number(), projects: z.number(), teams: z.number() }).optional(),
  _me: z.object({ role: ZOrgRole, perms: ZOrgActions.array().optional() }).optional(),
});

const ZOrmMemberMe = z.object({
  perms: z.enum(['delete', 'members:manage#admin', 'members:manage#member']).array().optional(),
});
export const ZOrgMemberItem = ZOrgMember.extend({
  user: ZPublicUser.optional(),
  _me: ZOrmMemberMe.optional(),
});

export const ZOrgList = z.object({
  data: ZOrgItem.array(),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
});

export const ZOrgMemberList = z.object({
  data: ZOrgMemberItem.array(),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
});

export type OrgItem = z.infer<typeof ZOrgItem>;
export type OrgList = z.infer<typeof ZOrgList>;
export type OrgMemberItem = z.infer<typeof ZOrgMemberItem>;
export type OrgMemberList = z.infer<typeof ZOrgMemberList>;
export type OrgInvitationItem = z.infer<typeof OrgInvitationItem>;

export const OrgInvitationItem = ZOrgInvitation.extend({
  inviter: ZPublicUser.optional(),
  organization: ZOrganization.optional(),
});

export const ZOrgInviteItem = z.object({
  id: z.string(),
  email: z.string().email(),
  role: ZOrgRole,
  createdAt: z.date(),
  expiresAt: z.date(),
  organization: z.object({ id: z.string(), name: z.string(), logo: z.string().nullable() }),
  inviter: ZPublicUser,
});

export const ZOrgMemberInviteInput = z.object({
  orgId: z.string(),
  invites: z.array(z.object({ email: z.string().email(), role: ZOrgRole })),
});

export type OrgInviteItem = z.infer<typeof ZOrgInviteItem>;
export type OrgMemberInviteInput = z.infer<typeof ZOrgMemberInviteInput>;
