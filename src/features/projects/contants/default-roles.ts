import { PROJECT_ROLE_PERMISSION_KEYS, ProjectImport } from '@/contracts/projects';

type ProjectPermissionOptions = (typeof PROJECT_ROLE_PERMISSION_KEYS)[number];
const buildPermission = (perms: {
  [key in ProjectPermissionOptions]: boolean;
}): ProjectPermissionOptions[] => {
  return Object.entries(perms)
    .filter(([, value]) => value)
    .map(([key]) => key as ProjectPermissionOptions);
};

// ------- Default matrix -------
type ProjectRole = Omit<ProjectImport['roles'][number], 'createdAt' | 'updatedAt'> & { id: string };
export const getDefaultRoles = (): ProjectRole[] => [
  {
    id: 'product_owner',
    name: 'Product Owner',
    description: 'Responsible for defining project vision and managing the product backlog.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:manage': true,
      'kanban.column:manage': true,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'scrum_master',
    name: 'Scrum Master',
    description: 'Facilitates the Scrum process and removes impediments for the team.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Works on tasks and contributes to the development of the product.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': false,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder',
    description: 'Interested party who needs to stay informed about project progress.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog.issue:manage': false,
      'backlog.sprint:manage': false,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
];
