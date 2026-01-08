import { z } from 'zod';
import {
  PROJECT_ACTIONS,
  PROJECT_ROLE_PERMISSION_KEYS,
  ZProject,
  ZProjectLead,
  ZProjectRole,
} from './project';

const ZIssueField = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number(),
  description: z.string().nullish(),
  iconURL: z.string().nullish(),
  color: z.string().nullish(),
});

const ZIssueType = ZIssueField.extend({ hierarchy: z.number() });

export const ZProjectPermissions = z.record(
  z.enum([...PROJECT_ACTIONS, ...PROJECT_ROLE_PERMISSION_KEYS]),
  z.boolean().optional(),
);

export const ZProjectPermissionRes = z.object({
  roles: z.array(ZProjectRole),
});

export type ProjectPermissionRes = z.infer<typeof ZProjectPermissionRes>;

export const ZProjectFilter = z.object({
  search: z.string().optional(),
  workspaceId: z.string().optional(),
});

export const ZProjectSort = z.object({
  field: z.enum(['createdAt', 'name', 'updatedAt']).optional(),
});

export const ZProjectQueryParams = z.object({
  filter: ZProjectFilter.optional(),
  sort: ZProjectSort.optional(),
});

export const ZProjectItem = ZProject.extend({
  lead: ZProjectLead.optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),

  // ====
  statuses: ZIssueField.array().optional(),
  types: ZIssueType.array().optional(),
  priorities: ZIssueField.array().optional(),
  resolutions: ZIssueField.array().optional(),
  // ====
});

export const ZProjectListRes = z.object({ data: ZProjectItem.array(), meta: z.any() });

export type ProjectItem = z.infer<typeof ZProjectItem>;
export type ProjectListRes = z.infer<typeof ZProjectListRes>;
export type ProjectFilter = z.infer<typeof ZProjectFilter>;
export type ProjectSort = z.infer<typeof ZProjectSort>;
export type ProjectQueryParams = z.infer<typeof ZProjectQueryParams>;
