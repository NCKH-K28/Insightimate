import z from 'zod';
import { isoString } from '../_shared';

export const ZTeamCreateInput = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  avatar: z.string().min(1, 'Avatar URL is required').optional(),

  members: z.array(z.object({ userId: z.string().min(1, 'User ID is required') })).optional(),
});

export const ZTeamUpdateInput = ZTeamCreateInput.omit({ members: true })
  .partial()
  .extend({ id: z.string().min(1, 'Team ID is required') });

export type TeamCreateInput = z.infer<typeof ZTeamCreateInput>;
export type TeamUpdateInput = z.infer<typeof ZTeamUpdateInput>;

export const ZTeamMemberAddInput = z.object({
  users: z
    .object({ userId: z.string().min(1, 'User ID is required') })
    .array()
    .min(1, 'At least one user is required'),
});
export type TeamMemberAddInput = z.infer<typeof ZTeamMemberAddInput>;

// ===
export const ZTeamMember = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    avatar: z.string().nullish(),
  }),
});

export const ZTeamItem = z.object({
  id: z.string(),
  name: z.string(),
  leadId: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  workspaceId: z.string(),
  createdAt: isoString,
  updatedAt: isoString,

  members: z.array(ZTeamMember).optional(),
  _count: z.object({ members: z.number() }).optional(),
});

export const ZTeamList = z.object({
  data: z.array(ZTeamItem),
  meta: z.object({ total: z.number() }),
});

export type TeamItem = z.infer<typeof ZTeamItem>;
export type TeamList = z.infer<typeof ZTeamList>;
