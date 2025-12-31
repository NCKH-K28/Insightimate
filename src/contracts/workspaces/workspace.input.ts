import { z } from 'zod';
import { ZWorkspace, ZWorkspaceRole } from './workspace';
import { ZProjectCreateInput } from '../projects';

export const ZWorkspaceCreateInput = z.object({ name: ZWorkspace.shape.name });
export const ZWorkspaceUpdateInput = z.object({ name: ZWorkspace.shape.name.optional() });
export const ZWsMemberAddInput = z.object({
  userId: z.string().min(1, 'User ID is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  role: ZWorkspaceRole,
});

export const ZMemberInviteInput = z.object({ invitees: z.array(z.email()), role: ZWorkspaceRole });
export const ZWsMemberInviteInput = ZMemberInviteInput; // alias

export type MemberInviteInput = z.infer<typeof ZMemberInviteInput>;
export type WorkspaceCreateInput = z.infer<typeof ZWorkspaceCreateInput>;
export type WorkspaceUpdateInput = z.infer<typeof ZWorkspaceUpdateInput>;
export type WsMemberAddInput = z.infer<typeof ZWsMemberAddInput>;

// == WS PROJECTS
export const ZWsProjectCreateInput = ZProjectCreateInput.omit({ workspaceId: true, leadId: true });
export type WsProjectCreateInput = z.infer<typeof ZWsProjectCreateInput>;
