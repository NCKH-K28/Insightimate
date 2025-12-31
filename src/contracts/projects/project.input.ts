import { z } from 'zod';
import { ZIdString, ZProject, ZProjectRole } from './project';

// Project Roles
export const ZProjectRoleCreateInput = ZProjectRole.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ZProjectRoleUpdateInput = ZProjectRoleCreateInput.partial().extend({ id: ZIdString });

export const ZTransientRole = z.string().regex(/^delete:[a-zA-Z0-9_-]+#transient$/, {
  error: (e) => `Recived:${e.value}, but expected: "delete:{roleId}#transient"`,
});
export const ZProjectRoleDeleteInput = z.object({
  id: ZIdString,
  action: z.union([z.literal('delete'), ZTransientRole]),
});

export const ZProjectRoleWriteInput = z.object({
  projectId: ZIdString,
  create: ZProjectRoleCreateInput.extend({ id: ZIdString }).array().optional(),
  update: ZProjectRoleUpdateInput.array().optional(),
  delete: ZProjectRoleDeleteInput.array().optional(),
});

export type ProjectRoleDeleteInput = z.infer<typeof ZProjectRoleDeleteInput>;
export type ProjectRoleWriteInput = z.infer<typeof ZProjectRoleWriteInput>;
export type ProjectRoleCreateInput = z.infer<typeof ZProjectRoleCreateInput>;
export type ProjectRoleUpdateInput = z.infer<typeof ZProjectRoleUpdateInput>;

// ===== Project =====
export const ZProjectCreateInput = ZProject.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  boardId: true,
}).extend({ roles: ZProjectRoleCreateInput.omit({ projectId: true }).array().optional() });

export const ZProjectUpdateInput = z.object({
  name: ZProject.shape.name.optional(),
  description: ZProject.shape.description.optional(),
  avatar: ZProject.shape.avatar.nullish(),
});

export type ProjectCreateInput = z.infer<typeof ZProjectCreateInput>;
export type ProjectUpdateInput = z.infer<typeof ZProjectUpdateInput>;

export const ZProjectPermissionCreateInput = z.object({ roles: ZProjectRoleCreateInput.array() });
export const ZProjectPermissionUpdateInput = z.object({ roles: ZProjectRole.array() });

export const ZProjectDeleteRolesInput = z.object({
  roleIds: z
    .string()
    .array()
    .min(1, 'At least one roleId must be provided')
    .max(1, 'Only one roleId can be deleted at a time'),
  transientTo: z.string().optional(),
});

export type ProjectPermissionCreateInput = z.infer<typeof ZProjectPermissionCreateInput>;
export type ProjectPermissionUpdateInput = z.infer<typeof ZProjectPermissionUpdateInput>;

// ===== Project Actors =====
export const ZProjectActorAddInput = z.object({
  projectId: ZIdString,
  actorId: ZIdString,
  actorType: z.enum(['USER', 'TEAM']),
  roleId: ZIdString,
});

export const ZProjectActorUpdateInput = z.object({ id: ZIdString, roleId: ZIdString });
export const ZProjectActorRemoveInput = z.object({ id: ZIdString });

export type ProjectActorAddInput = z.infer<typeof ZProjectActorAddInput>;
export type ProjectActorUpdateInput = z.infer<typeof ZProjectActorUpdateInput>;
export type ProjectActorRemoveInput = z.infer<typeof ZProjectActorRemoveInput>;
