// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatarURL?: string;
}

export interface IssueType {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface IssuePriority {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface IssueStatus {
  id: string;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE';
  color?: string;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  assignee?: User;
  reporter?: User;
  storyPoints?: number;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  state: 'FUTURE' | 'ACTIVE' | 'CLOSED';
  startAt?: Date;
  endAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  key: string;
}

export interface Board {
  id: string;
  name: string;
  project?: Project;
}

export interface BoardColumn {
  id: string;
  name: string;
  statuses: IssueStatus[];
  limit?: number;
}

export interface SprintIssue {
  id: string;
  issue: Issue;
  rank: number;
}

export interface BurndownDataPoint {
  day: string;
  idealPoints: number;
  remainingPoints?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john. doe@example.com',
    avatarURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarURL: 'https://api.dicebear. com/7.x/avataaars/svg?seed=jane',
  },
  {
    id: 'user-3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    avatarURL: 'https://api.dicebear.com/7. x/avataaars/svg?seed=bob',
  },
  {
    id: 'user-4',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    avatarURL: 'https://api.dicebear. com/7.x/avataaars/svg?seed=alice',
  },
];

export const mockIssueTypes: IssueType[] = [
  { id: 'story', name: 'Story', color: '#36B37E' },
  { id: 'bug', name: 'Bug', color: '#FF5630' },
  { id: 'task', name: 'Task', color: '#4C9AFF' },
  { id: 'epic', name: 'Epic', color: '#6554C0' },
  { id: 'spike', name: 'Spike', color: '#FFAB00' },
];

export const mockPriorities: IssuePriority[] = [
  { id: 'highest', name: 'Highest', color: '#FF5630', order: 1 },
  { id: 'high', name: 'High', color: '#FF7452', order: 2 },
  { id: 'medium', name: 'Medium', color: '#FFAB00', order: 3 },
  { id: 'low', name: 'Low', color: '#36B37E', order: 4 },
  { id: 'lowest', name: 'Lowest', color: '#4C9AFF', order: 5 },
];

export const mockStatuses: IssueStatus[] = [
  { id: 'todo', name: 'To Do', category: 'TODO' },
  { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS' },
  { id: 'in-review', name: 'In Review', category: 'IN_PROGRESS' },
  { id: 'done', name: 'Done', category: 'DONE' },
];

export const mockProject: Project = {
  id: 'proj-1',
  name: 'Project Alpha',
  key: 'ALPHA',
};

export const mockBoard: Board = {
  id: 'board-1',
  name: 'Alpha Team Board',
  project: mockProject,
};

export const mockBoardColumns: BoardColumn[] = [
  {
    id: 'col-todo',
    name: 'To Do',
    statuses: [mockStatuses[0]],
    limit: 10,
  },
  {
    id: 'col-in-progress',
    name: 'In Progress',
    statuses: [mockStatuses[1]],
    limit: 5,
  },
  {
    id: 'col-in-review',
    name: 'In Review',
    statuses: [mockStatuses[2]],
    limit: 3,
  },
  {
    id: 'col-done',
    name: 'Done',
    statuses: [mockStatuses[3]],
  },
];

export const mockSprint: Sprint = {
  id: 'sprint-1',
  name: 'Sprint 23',
  goal: 'Complete user authentication flow and implement dashboard analytics',
  state: 'ACTIVE',
  startAt: new Date('2024-12-01'),
  endAt: new Date('2024-12-14'),
  startedAt: new Date('2024-12-01T09:00:00'),
};

const createIssue = (
  id: string,
  key: string,
  summary: string,
  typeId: string,
  priorityId: string,
  statusId: string,
  assigneeId?: string,
  storyPoints?: number,
  labels?: string[],
): Issue => ({
  id,
  key,
  summary,
  type: mockIssueTypes.find((t) => t.id === typeId)!,
  priority: mockPriorities.find((p) => p.id === priorityId)!,
  status: mockStatuses.find((s) => s.id === statusId)!,
  assignee: assigneeId ? mockUsers.find((u) => u.id === assigneeId) : undefined,
  storyPoints,
  labels,
  createdAt: new Date('2024-11-28'),
  updatedAt: new Date('2024-12-05'),
});

export const mockSprintIssues: SprintIssue[] = [
  {
    id: 'si-1',
    issue: createIssue(
      'issue-1',
      'ALPHA-101',
      'Implement user login with OAuth2',
      'story',
      'high',
      'in-progress',
      'user-1',
      8,
      ['auth', 'frontend'],
    ),
    rank: 1,
  },
  {
    id: 'si-2',
    issue: createIssue(
      'issue-2',
      'ALPHA-102',
      'Fix password reset email not sending',
      'bug',
      'highest',
      'in-review',
      'user-2',
      3,
      ['auth', 'email'],
    ),
    rank: 2,
  },
  {
    id: 'si-3',
    issue: createIssue(
      'issue-3',
      'ALPHA-103',
      'Create dashboard analytics component',
      'story',
      'medium',
      'todo',
      'user-3',
      13,
      ['dashboard'],
    ),
    rank: 3,
  },
  {
    id: 'si-4',
    issue: createIssue(
      'issue-4',
      'ALPHA-104',
      'Add unit tests for auth service',
      'task',
      'medium',
      'todo',
      'user-1',
      5,
    ),
    rank: 4,
  },
  {
    id: 'si-5',
    issue: createIssue(
      'issue-5',
      'ALPHA-105',
      'Implement user profile page',
      'story',
      'low',
      'done',
      'user-4',
      5,
      ['profile', 'frontend'],
    ),
    rank: 5,
  },
  {
    id: 'si-6',
    issue: createIssue(
      'issue-6',
      'ALPHA-106',
      'Research caching strategies',
      'spike',
      'low',
      'done',
      'user-2',
      3,
    ),
    rank: 6,
  },
  {
    id: 'si-7',
    issue: createIssue(
      'issue-7',
      'ALPHA-107',
      'Button click not working on mobile',
      'bug',
      'high',
      'in-progress',
      'user-3',
      2,
      ['mobile', 'ui'],
    ),
    rank: 7,
  },
  {
    id: 'si-8',
    issue: createIssue(
      'issue-8',
      'ALPHA-108',
      'Set up CI/CD pipeline',
      'task',
      'medium',
      'done',
      'user-1',
      8,
      ['devops'],
    ),
    rank: 8,
  },
  {
    id: 'si-9',
    issue: createIssue(
      'issue-9',
      'ALPHA-109',
      'Design system documentation',
      'task',
      'low',
      'todo',
      undefined,
      5,
      ['docs'],
    ),
    rank: 9,
  },
  {
    id: 'si-10',
    issue: createIssue(
      'issue-10',
      'ALPHA-110',
      'Implement notification system',
      'story',
      'medium',
      'todo',
      'user-4',
      8,
      ['notifications'],
    ),
    rank: 10,
  },
];

export const mockBurndownData: BurndownDataPoint[] = [
  { day: 'Day 1', idealPoints: 60, remainingPoints: 60 },
  { day: 'Day 2', idealPoints: 54, remainingPoints: 58 },
  { day: 'Day 3', idealPoints: 48, remainingPoints: 52 },
  { day: 'Day 4', idealPoints: 42, remainingPoints: 48 },
  { day: 'Day 5', idealPoints: 36, remainingPoints: 40 },
  { day: 'Day 6', idealPoints: 30, remainingPoints: 35 },
  { day: 'Day 7', idealPoints: 24, remainingPoints: 29 },
  { day: 'Day 8', idealPoints: 18, remainingPoints: undefined },
  { day: 'Day 9', idealPoints: 12, remainingPoints: undefined },
  { day: 'Day 10', idealPoints: 6, remainingPoints: undefined },
  { day: 'Day 11', idealPoints: 0, remainingPoints: undefined },
];
