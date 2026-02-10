import { z } from 'zod';
import { isoString } from '../_shared';
import { ZUserPublic } from '../user';

export const WORKSPACE_ROLES = ['WS_ADMIN', 'WS_MEMBER'] as const;
export const WORKSPACE_ACTIONS = [
  'view',
  'read',
  'update',
  'delete',

  //
  'members:manage#admin',
  'members:manage#member',
  'projects:create',
  'plans:create',
] as const;

export const WORKSPACE_MEMBER_ACTIONS = ['revoke', 'assign_role'] as const;

//
export const ZWorkspaceActionKey = z.enum(WORKSPACE_ACTIONS);
export const ZWorkspaceMemberActionKey = z.enum(WORKSPACE_MEMBER_ACTIONS);
export const ZWorkspaceRole = z.enum(WORKSPACE_ROLES);
export const ZWorkspaceOwner = ZUserPublic;
export const ZWorkspacePermissions = z.record(z.string(), z.boolean());
export const ZWorkspace = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workspace name is required'),
  ownerId: z.string(),
  createdAt: isoString,
  updatedAt: isoString,
  removedAt: isoString.nullable(),
});

export const ZWorkspaceMember = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  role: ZWorkspaceRole,
  createdAt: isoString,
  updatedAt: isoString,
});

export type WorkspaceRole = z.infer<typeof ZWorkspaceRole>;
export type Workspace = z.infer<typeof ZWorkspace>;
export type WorkspaceMember = z.infer<typeof ZWorkspaceMember>;
export type WorkspaceOwner = z.infer<typeof ZWorkspaceOwner>;
export type WorkspacePermissions = z.infer<typeof ZWorkspacePermissions>;
export type WorkspaceActionKey = z.infer<typeof ZWorkspaceActionKey>;
export type WorkspaceMemberActionKey = z.infer<typeof ZWorkspaceMemberActionKey>;
