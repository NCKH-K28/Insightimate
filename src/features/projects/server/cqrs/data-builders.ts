import { Prisma } from '@prisma/client';
import { ProjectCreateInput } from '@/contracts/projects';
import { addSeconds } from 'date-fns';
import {
  genProjectRoleId,
  genIssuePriorityId,
  genIssueStatusId,
  genIssueTypeId,
  genIssueResolutionId,
} from './id-generators';
import type { TemplateConfig } from './types';

export const buildRoleCreateManyData = (
  input: ProjectCreateInput,
  projectId: string,
): Prisma.ProjectRoleCreateManyProjectInput[] => {
  if (!input.roles || input.roles.length === 0) return [];

  return input.roles.map((r, idx) => ({
    ...r,
    id: genProjectRoleId(),
    projectId,
    createdAt: addSeconds(new Date(), idx).toISOString(),
    updatedAt: addSeconds(new Date(), idx).toISOString(),
  }));
};

export const buildPriorityCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssuePriorityCreateManyProjectInput[] => {
  const { priorities } = templateConfig;
  if (!priorities || priorities.length === 0) return [];
  return priorities.map((p) => ({ ...p, id: genIssuePriorityId() }));
};

export const buildStatusCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueStatusCreateManyProjectInput[] => {
  const { statuses } = templateConfig;
  if (!statuses || statuses.length === 0) return [];
  return statuses.map((s) => ({ ...s, id: genIssueStatusId() }));
};

export const buildTypeCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueTypeCreateManyProjectInput[] => {
  const { types } = templateConfig;
  if (!types || types.length === 0) return [];
  return types.map((t) => ({ ...t, id: genIssueTypeId() }));
};

export const buildResolutionCreateManyData = (
  templateConfig: TemplateConfig,
): Prisma.IssueResolutionCreateManyProjectInput[] => {
  const { resolutions } = templateConfig;
  if (!resolutions || resolutions.length === 0) return [];
  return resolutions.map((r) => ({ ...r, id: genIssueResolutionId() }));
};
