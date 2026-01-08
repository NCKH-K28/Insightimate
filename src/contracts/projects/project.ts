import { z } from 'zod';
import { isoString } from '../_shared';
import { ZUserPublic } from '../users';

export const ZIdString = z.string().min(1, 'ID is required');

export const PROJECT_ACTIONS = ['view', 'create', 'update', 'delete', 'manage-roles'] as const;

export const PROJECT_ROLE_PERMISSION_KEYS = Object.freeze([
  'kanban:manage',
  'kanban.column:manage',
  'kanban.issue:manage',

  'backlog:manage',
  'backlog.issue:manage',
  'backlog.sprint:manage',
] as const);

export const ZProjectRolePermissionKey = z.enum(PROJECT_ROLE_PERMISSION_KEYS);

export const ZProjectRole = z.object({
  id: ZIdString,
  name: z.string().min(1, 'Role name is required'),
  projectId: ZIdString,
  description: z.string().optional(),
  permissions: z.array(ZProjectRolePermissionKey),
  createdAt: isoString,
  updatedAt: isoString,
});

export const ZProjectLead = ZUserPublic;
export const ZProjectKey = z
  .string()
  .min(1, 'Project key is required')
  .max(10, 'Project key must be less than 10 characters')
  .regex(
    /^[A-Z0-9_-]+$/,
    'Project key must contain only uppercase letters, numbers, underscores, and hyphens',
  );
export const ZProjectType = z.enum(['SOFTWARE']);
export const ZProject = z.object({
  id: ZIdString,
  key: ZProjectKey,
  type: ZProjectType,
  avatar: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullish(),
  leadId: ZIdString,
  workspaceId: ZIdString,
  boardId: ZIdString.nullish(),
  createdAt: isoString,
  updatedAt: isoString,
});

const ZFacet = z.object({ value: z.string(), label: z.unknown(), count: z.number() });

export const ZProjectTypeFacet = ZFacet.extend({ label: z.string() });
export const ZProjectLeadFacet = ZFacet.extend({
  label: ZProjectLead.pick({ name: true, avatar: true }),
});

export const ZProjectFacets = z.object({
  types: z.array(ZProjectTypeFacet),
  leads: z.array(ZProjectLeadFacet),
});

// ===== Types =====
export type Project = z.infer<typeof ZProject>;
export type ProjectRole = z.infer<typeof ZProjectRole>;
export type ProjectRolePermissionKey = z.infer<typeof ZProjectRolePermissionKey>;
export type ProjectLead = z.infer<typeof ZProjectLead>;
export type ProjectType = z.infer<typeof ZProjectType>;

export type ProjectTypeFacet = z.infer<typeof ZProjectTypeFacet>;
export type ProjectLeadFacet = z.infer<typeof ZProjectLeadFacet>;
export type ProjectFacets = z.infer<typeof ZProjectFacets>;
