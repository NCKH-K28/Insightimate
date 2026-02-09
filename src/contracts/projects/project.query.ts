// ============================ project.query.ts ============================
import { z } from 'zod';
import {
  PROJECT_ACTIONS,
  PROJECT_ROLE_PERMISSION_KEYS,
  ZProject,
  ZProjectLead,
  ZProjectPermissionKey,
  ZProjectRole,
} from './project';

// ---------- Query primitives ----------
export const ZSortOrder = z.enum(['asc', 'desc']);

export const ZPaginationParams = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(200).optional(),
});

export const ZListMeta = z.object({
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNext: z.boolean().optional(),
});

// ---------- Permissions ----------
export const ZProjectPermissions = z.record(ZProjectPermissionKey, z.boolean());

// ---------- Responses ----------
export const ZProjectPermissionRes = z.object({
  roles: z.array(ZProjectRole),
});

export type ProjectPermissionRes = z.infer<typeof ZProjectPermissionRes>;

// ---------- Filters / Sort ----------
export const ZProjectFilter = z.object({
  search: z.string().trim().optional(),
  orgId: z.string().trim().optional(),
});

export const ZProjectSort = z.object({
  field: z.enum(['createdAt', 'name', 'updatedAt']).optional(),
  order: ZSortOrder.optional(),
});

export const ZProjectQueryParams = z.object({
  filter: ZProjectFilter.optional(),
  sort: ZProjectSort.optional(),
  pagination: ZPaginationParams.optional(),
});

// ---------- Project Item (list/detail DTO) ----------
const ZIssueField = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  sequence: z.number(),
  description: z.string().trim().nullish(),
  iconURL: z.string().trim().url().nullish(),
  color: z.string().trim().nullish(),
});

const ZIssueTypeField = ZIssueField.extend({ hierarchy: z.number() });

export const ZProjectItem = ZProject.extend({
  lead: ZProjectLead.optional(),
  permissions: ZProjectPermissions.optional(),

  statuses: ZIssueField.array().optional(),
  types: ZIssueTypeField.array().optional(),
  priorities: ZIssueField.array().optional(),
  resolutions: ZIssueField.array().optional(),
});

export const ZProjectListRes = z.object({
  data: ZProjectItem.array(),
  meta: ZListMeta,
});

export type ProjectItem = z.infer<typeof ZProjectItem>;
export type ProjectListRes = z.infer<typeof ZProjectListRes>;
export type ProjectFilter = z.infer<typeof ZProjectFilter>;
export type ProjectSort = z.infer<typeof ZProjectSort>;
export type ProjectQueryParams = z.infer<typeof ZProjectQueryParams>;

export const ZProjectPermissionKeysFlat = z.enum([
  ...PROJECT_ACTIONS,
  ...(PROJECT_ROLE_PERMISSION_KEYS as string[]),
] as [string, ...string[]]);
