import { z } from 'zod';
import { ZUserPublic } from '../user';
import { ZWorkspace, ZWorkspaceOwner, ZWorkspacePermissions, ZWorkspaceRole } from './workspace';

export const ZWorkspaceFilter = z.object({
  search: z.string().optional(),
  memberId: z.string().optional(),
});

export const ZWorkspaceQueryParams = z.object({ filter: ZWorkspaceFilter.optional() });

export const ZWorkspaceItem = ZWorkspace.extend({
  owner: ZWorkspaceOwner.optional(),
  permissions: ZWorkspacePermissions.optional(),
});

export const ZWorkspaceListRes = z.object({ data: ZWorkspaceItem.array(), meta: z.any() });

const ZWsMemberPermissions = z.record(z.string(), z.boolean());
export const ZWsMemberItem = z.object({
  id: z.string(),
  role: ZWorkspaceRole,
  userId: z.string(),
  user: ZUserPublic.optional(),
  permissions: ZWsMemberPermissions.optional(),
});
export const ZWsMemberList = ZWsMemberItem.array();
export const ZWsMemberListRes = z.object({ data: ZWsMemberItem.array(), meta: z.any() });

export type WorkspaceItem = z.infer<typeof ZWorkspaceItem>;
export type WorkspaceListRes = z.infer<typeof ZWorkspaceListRes>;
export type WsMemberItem = z.infer<typeof ZWsMemberItem>;
export type WsMemberListRes = z.infer<typeof ZWsMemberListRes>;
export const WsMemberList = ZWsMemberList;
