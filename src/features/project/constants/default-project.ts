// project-default.ts (constants/)
import type { ProjectImport } from '@/contracts/project';
import { getDefaultRoles } from './default-roles';

const ICONS = {
  priority: {
    lowest: '/icons/priority/lowest.svg',
    low: '/icons/priority/low.svg',
    medium: '/icons/priority/medium.svg',
    high: '/icons/priority/high.svg',
    highest: '/icons/priority/highest.svg',
  },
  type: {
    epic: '/icons/issue-type/epic.svg',
    story: '/icons/issue-type/story.svg',
    bug: '/icons/issue-type/bug.svg',
    task: '/icons/issue-type/task.svg',
    subTask: '/icons/issue-type/sub-task.svg',
  },
  resolution: {
    fixed: '/icons/resolution/fixed.svg',
    wontFix: '/icons/resolution/wont-fix.svg',
    duplicate: '/icons/resolution/duplicate.svg',
    incomplete: '/icons/resolution/incomplete.svg',
  },
} as const;

const withSequence = <T extends object>(items: readonly T[]): Array<T & { sequence: number }> =>
  items.map((item, sequence) => ({ ...item, sequence }));

// ---------- Priorities ----------
type Priority = ProjectImport['priorities'][number];
type PriorityBase = Omit<Priority, 'sequence'>;

const PRIORITY_BASE = [
  { id: 'lowest', name: 'Lowest', color: '#7ED321', iconURL: ICONS.priority.lowest },
  { id: 'low', name: 'Low', color: '#7ED321', iconURL: ICONS.priority.low },
  { id: 'medium', name: 'Medium', color: '#F5A623', iconURL: ICONS.priority.medium },
  { id: 'high', name: 'High', color: '#D0021B', iconURL: ICONS.priority.high },
  { id: 'highest', name: 'Highest', color: '#D0021B', iconURL: ICONS.priority.highest },
] as const satisfies readonly PriorityBase[];

export const DEFAULT_PRIORITIES: Priority[] = withSequence(PRIORITY_BASE);

// ---------- Types ----------
type IssueType = ProjectImport['types'][number];
type IssueTypeBase = Omit<IssueType, 'sequence'>;

const TYPE_BASE = [
  { id: 'epic', name: 'Epic', hierarchy: 2, color: '#1E40AF', iconURL: ICONS.type.epic },
  { id: 'story', name: 'Story', hierarchy: 1, color: '#047857', iconURL: ICONS.type.story },
  { id: 'bug', name: 'Bug', hierarchy: 1, color: '#DC2626', iconURL: ICONS.type.bug },
  { id: 'task', name: 'Task', hierarchy: 1, color: '#7C3AED', iconURL: ICONS.type.task },
  { id: 'sub-task', name: 'Sub-task', hierarchy: 0, color: '#F59E0B', iconURL: ICONS.type.subTask },
] as const satisfies readonly IssueTypeBase[];

export const DEFAULT_TYPES: IssueType[] = withSequence(TYPE_BASE);

// ---------- Statuses ----------
type Status = ProjectImport['statuses'][number];
type StatusBase = Omit<Status, 'sequence'>;

const STATUS_BASE = [
  { id: 'todo', name: 'To do', category: 'TODO', color: '#9CA3AF' },
  { id: 'progress', name: 'In progress', category: 'IN_PROGRESS', color: '#3B82F6' },
  { id: 'done', name: 'Done', category: 'DONE', color: '#10B981' },
] as const satisfies readonly StatusBase[];

export const DEFAULT_STATUSES: Status[] = withSequence(STATUS_BASE);

// ---------- Resolutions ----------
type Resolution = Priority;
type ResolutionBase = Omit<Resolution, 'sequence'>;

const RESOLUTION_BASE = [
  { id: 'fixed', name: 'Fixed' },
  { id: 'won-t-fix', name: "Won't Fix" },
  { id: 'duplicate', name: 'Duplicate' },
  { id: 'incomplete', name: 'Incomplete' },
  { id: 'cannot-reproduce', name: 'Cannot Reproduce' },
] as const satisfies readonly ResolutionBase[];

export const DEFAULT_RESOLUTIONS: Resolution[] = withSequence(RESOLUTION_BASE);

// ---------- Project ----------
const DEFAULT_PROJECT: ProjectImport = {
  id: 'NEW_PROJECT',
  key: '',
  name: '',
  leadId: '',
  description: '',
  actors: [],
  issues: [],
  roles: getDefaultRoles(),
  priorities: DEFAULT_PRIORITIES,
  statuses: DEFAULT_STATUSES,
  types: DEFAULT_TYPES,
  avatar: '/icons/project/1000.svg',
} as const;

export const getDefaultProject = () => structuredClone(DEFAULT_PROJECT);
export const defaultProject = Object.freeze(DEFAULT_PROJECT);
