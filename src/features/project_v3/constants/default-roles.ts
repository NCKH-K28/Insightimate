import { PROJECT_ROLE_PERMISSION_KEYS } from '@/contracts/project';

type PermissionKey = (typeof PROJECT_ROLE_PERMISSION_KEYS)[number];

const pickPermissions = (flags: Partial<Record<PermissionKey, boolean>>): PermissionKey[] =>
  (Object.keys(flags) as PermissionKey[]).filter((k) => flags[k]);

const P = {
  backlogManage: { 'backlog:manage': true },
  issueManage: { 'backlog.issue:manage': true },
  sprintManage: { 'backlog.sprint:manage': true },
  kanbanManage: { 'kanban:manage': true },
  columnManage: { 'kanban.column:manage': true },
  kanbanIssueManage: { 'kanban.issue:manage': true },
} as const;

const ROLE_DEFS = [
  {
    name: 'Product Owner',
    description: 'Responsible for defining project vision and managing the product backlog.',
    perms: {
      ...P.backlogManage,
      ...P.issueManage,
      ...P.sprintManage,
      ...P.kanbanManage,
      ...P.columnManage,
      ...P.kanbanIssueManage,
    },
  },
  {
    name: 'Scrum Master',
    description: 'Facilitates the Scrum process and removes impediments for the team.',
    perms: { ...P.backlogManage, ...P.issueManage, ...P.sprintManage },
  },
  {
    name: 'Developer',
    description: 'Works on tasks and contributes to the development of the product.',
    perms: { ...P.issueManage, ...P.kanbanIssueManage },
  },
  {
    name: 'Stakeholder',
    description: 'Interested party who needs to stay informed about project progress.',
    perms: {},
  },
] as const;

export type DefaultRole = {
  name: string;
  description: string;
  permissions: PermissionKey[];
};

export const getDefaultRoles = (): DefaultRole[] =>
  ROLE_DEFS.map(({ perms, ...r }) => ({ ...r, permissions: pickPermissions(perms) }));
