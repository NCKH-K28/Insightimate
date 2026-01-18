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
  owner: ZPublicUser,

  // == System Extended Fields ==
  _count: z.object({ members: z.number(), projects: z.number(), teams: z.number() }).optional(),
  _me: z.object({ role: ZOrgRole, perms: ZOrgActions.array().optional() }).optional(),
});
export const ZOrgMemberItem = ZOrgMember;

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
  inviter: ZPublicUser,
  organization: ZOrganization,
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

export type OrgInviteItem = z.infer<typeof ZOrgInviteItem>;
