import { z } from 'zod';
import { isoString } from '../_shared';

export const ORG_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ORG_MEMBER'] as const;
export const ORG_ACTIONS = [
  'read',
  'update',
  'delete',
  'members:manage#admin',
  'members:manage#member',
  'projects:create',
  'plans:create',
] as const;

export const ORG_SLUG_REGEX = /^[a-z0-9-]+$/;
export const ZOrgSlug = z.string().min(3).max(32).regex(ORG_SLUG_REGEX, 'Invalid slug');

export const ZOrganization = z.object({
  id: z.string(),
  name: z.string().min(3).max(64),
  slug: ZOrgSlug,
  description: z.string().optional(),
  logo: z.string().nullable(),
  ownerId: z.string(),
  createdAt: isoString,
  updatedAt: isoString,
  deletedAt: isoString.optional(),
});

export const ZOrgRole = z.enum(ORG_ROLES);
export const ZOrgMember = z.object({
  userId: z.string(),
  orgId: z.string(),
  role: ZOrgRole,
  createdAt: isoString,
  updatedAt: isoString,
});

export const ZOrgInvitation = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.email(),
  role: ZOrgRole,
  createdAt: isoString,
  updatedAt: isoString,
  expiresAt: isoString,
});

export type Organization = z.infer<typeof ZOrganization>;
export type OrgRole = z.infer<typeof ZOrgRole>;
export type OrgMember = z.infer<typeof ZOrgMember>;
export type OrgInvitation = z.infer<typeof ZOrgInvitation>;
