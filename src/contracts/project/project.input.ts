// ============================ project.input.ts ============================
import { z } from 'zod';
import { ZProject, ZProjectRole } from './project';
import {
  ZIssuePriority as ZIssuePriorityCore,
  ZIssueStatus as ZIssueStatusCore,
  ZIssueType as ZIssueTypeCore,
} from '../issues';
import { ZIdString } from '../_shared';

// ---------- Project Roles ----------
export const ZProjectRoleCreateInput = ZProjectRole.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ZProjectRoleUpdateInput = ZProjectRoleCreateInput.omit({ projectId: true })
  .partial()
  .extend({ id: ZIdString });

export const ZTransientRole = z
  .string()
  .refine((v) => /^delete:[a-zA-Z0-9_-]+#transient$/.test(v), {
    error: (v) => `Received: ${v}, expected: "delete:{roleId}#transient"`,
  });

export const ZProjectRoleDeleteInput = z.object({
  id: ZIdString,
  action: z.union([z.literal('delete'), ZTransientRole]),
});

export const ZProjectRoleWriteInput = z
  .object({
    projectId: ZIdString,
    create: ZProjectRoleCreateInput.omit({ projectId: true })
      .extend({ id: ZIdString })
      .array()
      .optional(),
    update: ZProjectRoleUpdateInput.array().optional(),
    delete: ZProjectRoleDeleteInput.array().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.create?.length && !v.update?.length && !v.delete?.length) {
      ctx.addIssue({ code: 'custom', message: 'At least one of create/update/delete is required' });
    }
  });

export type ProjectRoleDeleteInput = z.infer<typeof ZProjectRoleDeleteInput>;
export type ProjectRoleWriteInput = z.infer<typeof ZProjectRoleWriteInput>;
export type ProjectRoleCreateInput = z.infer<typeof ZProjectRoleCreateInput>;
export type ProjectRoleUpdateInput = z.infer<typeof ZProjectRoleUpdateInput>;

// ---------- Project ----------
const ZCreateType = ZIssueTypeCore.omit({ id: true, projectId: true }).strict();
const ZCreatePriority = ZIssuePriorityCore.omit({ id: true, projectId: true }).strict();
const ZCreateStatus = ZIssueStatusCore.omit({ id: true, projectId: true }).strict();

export const ZProjectCreateInput = ZProject.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  boardId: true,
}).extend({
  roles: ZProjectRoleCreateInput.omit({ projectId: true }).array().optional(),
  types: z.array(ZCreateType).optional(),
  priorities: z.array(ZCreatePriority).optional(),
  statuses: z.array(ZCreateStatus).optional(),
});

export const ZProjectUpdateInput = z.object({
  name: ZProject.shape.name.optional(),
  description: ZProject.shape.description.optional(),
  avatar: ZProject.shape.avatar.optional(),
});

export type ProjectCreateInput = z.infer<typeof ZProjectCreateInput>;
export type ProjectUpdateInput = z.infer<typeof ZProjectUpdateInput>;

// ---------- Permissions (Roles in project) ----------
export const ZProjectPermissionCreateInput = z.object({
  roles: ZProjectRoleCreateInput.array(),
});

export const ZProjectPermissionUpdateInput = z.object({
  roles: ZProjectRole.array(),
});

export const ZProjectDeleteRolesInput = z.object({
  roleId: ZIdString,
  transientTo: z.string().trim().optional(),
});

export type ProjectPermissionCreateInput = z.infer<typeof ZProjectPermissionCreateInput>;
export type ProjectPermissionUpdateInput = z.infer<typeof ZProjectPermissionUpdateInput>;

// ---------- Project Actors ----------
export const ZProjectActorType = z.enum(['USER', 'TEAM']);

export const ZProjectActor = z.object({
  id: ZIdString,
  projectId: ZIdString,
  actorId: ZIdString,
  actorType: ZProjectActorType,
  roleId: ZIdString,
  createdAt: ZProject.shape.createdAt,
  updatedAt: ZProject.shape.updatedAt,
});

export const ZProjectActorAddInput = z.object({
  projectId: ZIdString,
  actorId: ZIdString,
  actorType: ZProjectActorType,
  roleId: ZIdString,
});

export const ZProjectActorUpdateInput = z.object({ id: ZIdString, roleId: ZIdString });
export const ZProjectActorRemoveInput = z.object({ id: ZIdString });

export type ProjectActor = z.infer<typeof ZProjectActor>;
export type ProjectActorAddInput = z.infer<typeof ZProjectActorAddInput>;
export type ProjectActorUpdateInput = z.infer<typeof ZProjectActorUpdateInput>;
export type ProjectActorRemoveInput = z.infer<typeof ZProjectActorRemoveInput>;
