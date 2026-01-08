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
});

export type OrgInvitee = z.infer<typeof ZOrgInvitee>;
export type OrgCreateInput = z.infer<typeof ZOrgCreateInput>;
export type OrgUpdateInput = z.infer<typeof ZOrgUpdateInput>;

// ======== For Members
