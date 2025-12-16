import { ProjectImport } from '@/contracts/projects';
import { getDefaultRoles } from './default-roles';

const DEFAULT_PRIORITIES: ProjectImport['priorities'] = [
  { id: 'low', name: 'Low', color: '#10B981', sequence: 0 },
  { id: 'medium', name: 'Medium', color: '#3B82F6', sequence: 1 },
  { id: 'high', name: 'High', sequence: 2, color: '#F59E0B' },
  { id: 'critical', name: 'Critical', sequence: 3, color: '#EF4444' },
];

const DEFAULT_STATUSES: ProjectImport['statuses'] = [
  { id: 'todo', name: 'To do', sequence: 0, category: 'TODO', color: '#9CA3AF' },
  { id: 'progress', name: 'In progress', category: 'IN_PROGRESS', color: '#3B82F6', sequence: 1 },
  { id: 'done', name: 'Done', category: 'DONE', color: '#10B981', sequence: 2 },
];

const DEFAULT_TYPES: ProjectImport['types'] = [
  { id: 'epic', name: 'Epic', hierarchy: 2, sequence: 0, color: '#1E40AF' },
  { id: 'story', name: 'Story', hierarchy: 1, sequence: 1, color: '#047857' },
  { id: 'bug', name: 'Bug', hierarchy: 1, sequence: 2, color: '#DC2626' },
  { id: 'task', name: 'Task', hierarchy: 1, sequence: 3, color: '#7C3AED' },
  { id: 'sub-task', name: 'Sub-task', hierarchy: 0, sequence: 4, color: '#F59E0B' },
];

const DEFAULT_ROLES: ProjectImport['roles'] = getDefaultRoles();

const DEFAULT_PROJECT: ProjectImport = {
  id: 'NEW_PROJECT',
  key: '',
  name: '',
  leadId: '',
  description: '',
  actors: [],
  issues: [],
  roles: DEFAULT_ROLES,
  priorities: DEFAULT_PRIORITIES,
  statuses: DEFAULT_STATUSES,
  types: DEFAULT_TYPES,
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as const;

export const getDefaultProject = () => structuredClone(DEFAULT_PROJECT);

export const defaultProject = Object.freeze(DEFAULT_PROJECT);
