import { z } from 'zod';

export const ZInviteInput = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  action: z.enum(['ACCEPT', 'REJECT']),
});

export type InviteInput = z.infer<typeof ZInviteInput>;
