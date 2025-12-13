import SprintSummaryTab, {
  SprintSummaryTabProps,
  SprintIssue,
  SprintMember,
  SprintBlockerOrRisk,
  SprintDecision,
  BurndownPoint,
  SprintSummaryMetrics,
} from './tabs/summary-tab';

// ============ Sample Data ============

const sampleBurndownTrend: BurndownPoint[] = [
  { dayLabel: 'Day 1', remainingPoints: 42 },
  { dayLabel: 'Day 2', remainingPoints: 40 },
  { dayLabel: 'Day 3', remainingPoints: 38 },
  { dayLabel: 'Day 4', remainingPoints: 35 },
  { dayLabel: 'Day 5', remainingPoints: 32 },
  { dayLabel: 'Day 6', remainingPoints: 28 },
  { dayLabel: 'Day 7', remainingPoints: 24 },
  { dayLabel: 'Day 8', remainingPoints: 20 },
  { dayLabel: 'Day 9', remainingPoints: 18 },
  { dayLabel: 'Day 10', remainingPoints: 15 },
];

const sampleMetrics: SprintSummaryMetrics = {
  totalStoryPoints: 42,
  completedStoryPoints: 27,
  totalIssues: 18,
  issuesAddedAfterStart: 3,
  newBugs: 4,
  resolvedBugs: 6,
  burndownTrend: sampleBurndownTrend,
  burndownStatus: 'onTrack',
};

const sampleInProgressIssues: SprintIssue[] = [
  {
    id: 'issue-1',
    key: 'PROJ-101',
    title: 'Implement user authentication with OAuth2',
    status: 'inProgress',
    priority: 'critical',
    storyPoints: 8,
    assignee: {
      id: 'user-1',
      name: 'Nguyen Van A',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg? seed=NguyenVanA',
    },
    dueDate: '2025-12-10',
  },
  {
    id: 'issue-2',
    key: 'PROJ-102',
    title: 'Design dashboard UI components',
    status: 'inReview',
    priority: 'high',
    storyPoints: 5,
    assignee: {
      id: 'user-2',
      name: 'Tran Thi B',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranThiB',
    },
    dueDate: '2025-12-08',
  },
  {
    id: 'issue-3',
    key: 'PROJ-103',
    title: 'Set up CI/CD pipeline for staging environment',
    status: 'inProgress',
    priority: 'high',
    storyPoints: 5,
    assignee: {
      id: 'user-3',
      name: 'Le Van C',
      avatarUrl: 'https://api.dicebear.com/7. x/avataaars/svg?seed=LeVanC',
    },
  },
  {
    id: 'issue-4',
    key: 'PROJ-104',
    title: 'API integration for payment gateway',
    status: 'inProgress',
    priority: 'critical',
    storyPoints: 8,
    assignee: {
      id: 'user-1',
      name: 'Nguyen Van A',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanA',
    },
    dueDate: '2025-12-12',
  },
  {
    id: 'issue-5',
    key: 'PROJ-105',
    title: 'Write unit tests for user service',
    status: 'inReview',
    priority: 'medium',
    storyPoints: 3,
    assignee: {
      id: 'user-4',
      name: 'Pham Thi D',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg? seed=PhamThiD',
    },
  },
];

const sampleDoneHighlightIssues: SprintIssue[] = [
  {
    id: 'issue-10',
    key: 'PROJ-095',
    title: 'Database schema design and migration scripts',
    status: 'done',
    priority: 'critical',
    storyPoints: 8,
    assignee: {
      id: 'user-3',
      name: 'Le Van C',
      avatarUrl: 'https://api.dicebear. com/7.x/avataaars/svg?seed=LeVanC',
    },
    isHighlight: true,
  },
  {
    id: 'issue-11',
    key: 'PROJ-096',
    title: 'User registration and email verification flow',
    status: 'done',
    priority: 'high',
    storyPoints: 5,
    assignee: {
      id: 'user-1',
      name: 'Nguyen Van A',
      avatarUrl: 'https://api.dicebear. com/7.x/avataaars/svg?seed=NguyenVanA',
    },
    isHighlight: true,
  },
  {
    id: 'issue-12',
    key: 'PROJ-097',
    title: 'Setup project infrastructure on AWS',
    status: 'done',
    priority: 'critical',
    storyPoints: 8,
    assignee: {
      id: 'user-3',
      name: 'Le Van C',
      avatarUrl: 'https://api.dicebear. com/7.x/avataaars/svg?seed=LeVanC',
    },
    isHighlight: true,
  },
  {
    id: 'issue-13',
    key: 'PROJ-098',
    title: 'Implement logging and monitoring with Datadog',
    status: 'done',
    priority: 'medium',
    storyPoints: 3,
    assignee: {
      id: 'user-5',
      name: 'Hoang Van E',
      avatarUrl: 'https://api.dicebear.com/7. x/avataaars/svg?seed=HoangVanE',
    },
    isHighlight: true,
  },
];

const sampleBlockers: SprintBlockerOrRisk[] = [
  {
    id: 'blocker-1',
    title: 'Third-party API documentation incomplete',
    description: 'Payment gateway API docs are outdated, waiting for vendor response',
    ownerName: 'Nguyen Van A',
    severity: 'high',
  },
  {
    id: 'blocker-2',
    title: 'Staging server access pending approval',
    description: 'IT team needs to provision access for 2 new team members',
    ownerName: 'Le Van C',
    severity: 'medium',
  },
];

const sampleRisks: SprintBlockerOrRisk[] = [
  {
    id: 'risk-1',
    title: 'OAuth2 integration may require additional security review',
    description: 'Security team may request changes which could delay the feature by 2-3 days',
    ownerName: 'Nguyen Van A',
    severity: 'medium',
  },
  {
    id: 'risk-2',
    title: 'Team member availability during holiday season',
    description: 'Multiple team members have planned time off in the last week of sprint',
    ownerName: 'PM - Minh',
    severity: 'low',
  },
  {
    id: 'risk-3',
    title: 'Performance issues on large data sets',
    description: 'Initial testing shows slow response times with 10k+ records',
    ownerName: 'Le Van C',
    severity: 'high',
  },
];

const sampleDecisions: SprintDecision[] = [
  {
    id: 'decision-1',
    description: 'Use PostgreSQL instead of MongoDB for better relational data support',
    decidedBy: 'Tech Lead - Nguyen Van A',
    decidedAt: '2025-12-02',
  },
  {
    id: 'decision-2',
    description: 'Postpone mobile app development to next quarter, focus on web first',
    decidedBy: 'Product Owner - Tran Minh',
    decidedAt: '2025-12-03',
  },
  {
    id: 'decision-3',
    description: 'Adopt Tailwind CSS as the primary styling solution',
    decidedBy: 'Frontend Team',
    decidedAt: '2025-12-01',
  },
];

const sampleTeamMembers: SprintMember[] = [
  {
    id: 'user-1',
    name: 'Nguyen Van A',
    role: 'Tech Lead / Senior Dev',
    avatarUrl: 'https://api.dicebear.com/7. x/avataaars/svg?seed=NguyenVanA',
    availability: 'full',
  },
  {
    id: 'user-2',
    name: 'Tran Thi B',
    role: 'UI/UX Designer',
    avatarUrl: 'https://api.dicebear. com/7.x/avataaars/svg?seed=TranThiB',
    availability: 'full',
  },
  {
    id: 'user-3',
    name: 'Le Van C',
    role: 'DevOps Engineer',
    avatarUrl: 'https://api.dicebear.com/7. x/avataaars/svg?seed=LeVanC',
    availability: 'partial',
    timeOffDays: 2,
  },
  {
    id: 'user-4',
    name: 'Pham Thi D',
    role: 'QA Engineer',
    avatarUrl: 'https://api.dicebear.com/7. x/avataaars/svg?seed=PhamThiD',
    availability: 'full',
  },
  {
    id: 'user-5',
    name: 'Hoang Van E',
    role: 'Backend Developer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangVanE',
    availability: 'partial',
    timeOffDays: 1,
  },
  {
    id: 'user-6',
    name: 'Vo Thi F',
    role: 'Frontend Developer',
    avatarUrl: 'https://api. dicebear.com/7.x/avataaars/svg?seed=VoThiF',
    availability: 'off',
    timeOffDays: 5,
  },
];

const sampleUpcomingIssues: SprintIssue[] = [
  {
    id: 'upcoming-1',
    key: 'PROJ-110',
    title: 'Implement notification system',
    status: 'todo',
    priority: 'high',
    storyPoints: 5,
    assignee: {
      id: 'user-5',
      name: 'Hoang Van E',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangVanE',
    },
  },
  {
    id: 'upcoming-2',
    key: 'PROJ-111',
    title: 'Add export to PDF feature for reports',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    assignee: {
      id: 'user-2',
      name: 'Tran Thi B',
      avatarUrl: 'https://api. dicebear.com/7.x/avataaars/svg?seed=TranThiB',
    },
  },
  {
    id: 'upcoming-3',
    key: 'PROJ-112',
    title: 'Performance optimization for dashboard queries',
    status: 'todo',
    priority: 'critical',
    storyPoints: 5,
    assignee: {
      id: 'user-3',
      name: 'Le Van C',
      avatarUrl: 'https://api.dicebear. com/7.x/avataaars/svg?seed=LeVanC',
    },
  },
];

// ============ Complete Sample Props ============

export const sampleSprintSummaryProps: SprintSummaryTabProps = {
  sprintName: 'Sprint 12 - Q4 Release',
  projectName: 'E-Commerce Platform',
  status: 'active',
  startDate: '2025-12-01',
  endDate: '2025-12-14',
  sprintGoal:
    'Complete user authentication module and payment gateway integration.  Ensure staging environment is fully operational for QA testing.',
  teamName: 'Alpha Team',

  metrics: sampleMetrics,

  inProgressIssues: sampleInProgressIssues,
  doneHighlightIssues: sampleDoneHighlightIssues,

  blockers: sampleBlockers,
  risks: sampleRisks,
  decisions: sampleDecisions,

  teamMembers: sampleTeamMembers,
  plannedStoryPoints: 45,
  committedStoryPoints: 42,

  upcomingIssues: sampleUpcomingIssues,

  onViewBoard: () => {
    console.log('Navigate to Sprint Board');
    alert('Navigating to Sprint Board.. .');
  },
  onViewReport: () => {
    console.log('Navigate to Sprint Report');
    alert('Navigating to Sprint Report...');
  },
};

// ============ Alternative Sample Data (Completed Sprint) ============

export const completedSprintProps: SprintSummaryTabProps = {
  sprintName: 'Sprint 11 - Authentication',
  projectName: 'E-Commerce Platform',
  status: 'completed',
  startDate: '2025-11-17',
  endDate: '2025-11-30',
  sprintGoal: 'Implement core authentication features and user management.',
  teamName: 'Alpha Team',

  metrics: {
    totalStoryPoints: 38,
    completedStoryPoints: 35,
    totalIssues: 15,
    issuesAddedAfterStart: 1,
    newBugs: 2,
    resolvedBugs: 4,
    burndownTrend: [
      { dayLabel: 'Day 1', remainingPoints: 38 },
      { dayLabel: 'Day 2', remainingPoints: 35 },
      { dayLabel: 'Day 3', remainingPoints: 30 },
      { dayLabel: 'Day 4', remainingPoints: 25 },
      { dayLabel: 'Day 5', remainingPoints: 20 },
      { dayLabel: 'Day 6', remainingPoints: 15 },
      { dayLabel: 'Day 7', remainingPoints: 10 },
      { dayLabel: 'Day 8', remainingPoints: 5 },
      { dayLabel: 'Day 9', remainingPoints: 3 },
      { dayLabel: 'Day 10', remainingPoints: 3 },
    ],
    burndownStatus: 'ahead',
  },

  inProgressIssues: [],
  doneHighlightIssues: [
    {
      id: 'done-1',
      key: 'PROJ-080',
      title: 'User login with email/password',
      status: 'done',
      priority: 'critical',
      storyPoints: 5,
      assignee: {
        id: 'user-1',
        name: 'Nguyen Van A',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanA',
      },
      isHighlight: true,
    },
    {
      id: 'done-2',
      key: 'PROJ-081',
      title: 'Password reset functionality',
      status: 'done',
      priority: 'high',
      storyPoints: 3,
      assignee: {
        id: 'user-5',
        name: 'Hoang Van E',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangVanE',
      },
      isHighlight: true,
    },
  ],

  blockers: [],
  risks: [],
  decisions: [
    {
      id: 'dec-1',
      description: 'Use JWT tokens with 24h expiration for session management',
      decidedBy: 'Security Team',
      decidedAt: '2025-11-20',
    },
  ],

  teamMembers: sampleTeamMembers.slice(0, 4),
  plannedStoryPoints: 40,
  committedStoryPoints: 38,

  upcomingIssues: [],

  onViewBoard: () => console.log('View completed sprint board'),
  onViewReport: () => console.log('View completed sprint report'),
};

// ============ Alternative Sample Data (Upcoming Sprint) ============

export const upcomingSprintProps: SprintSummaryTabProps = {
  sprintName: 'Sprint 13 - Mobile Responsive',
  projectName: 'E-Commerce Platform',
  status: 'upcoming',
  startDate: '2025-12-15',
  endDate: '2025-12-28',
  sprintGoal: 'Make the entire platform mobile responsive and optimize for touch interactions.',
  teamName: 'Alpha Team',

  metrics: {
    totalStoryPoints: 40,
    completedStoryPoints: 0,
    totalIssues: 12,
    issuesAddedAfterStart: 0,
    newBugs: 0,
    resolvedBugs: 0,
    burndownTrend: [],
    burndownStatus: 'onTrack',
  },

  inProgressIssues: [],
  doneHighlightIssues: [],

  blockers: [],
  risks: [
    {
      id: 'risk-upcoming-1',
      title: 'Designer availability uncertain',
      description: 'UI/UX designer may be pulled into another project',
      ownerName: 'PM - Minh',
      severity: 'medium',
    },
  ],
  decisions: [],

  teamMembers: sampleTeamMembers,
  plannedStoryPoints: 42,
  committedStoryPoints: 40,

  upcomingIssues: [
    {
      id: 'future-1',
      key: 'PROJ-120',
      title: 'Implement responsive navigation menu',
      status: 'todo',
      priority: 'critical',
      storyPoints: 5,
      assignee: {
        id: 'user-2',
        name: 'Tran Thi B',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg? seed=TranThiB',
      },
    },
    {
      id: 'future-2',
      key: 'PROJ-121',
      title: 'Optimize images for mobile devices',
      status: 'todo',
      priority: 'high',
      storyPoints: 3,
    },
    {
      id: 'future-3',
      key: 'PROJ-122',
      title: 'Add touch gestures for product gallery',
      status: 'todo',
      priority: 'medium',
      storyPoints: 5,
      assignee: {
        id: 'user-6',
        name: 'Vo Thi F',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg? seed=VoThiF',
      },
    },
  ],

  onViewBoard: () => console.log('View upcoming sprint board'),
  onViewReport: () => console.log('View upcoming sprint report'),
};

// ============ Behind Schedule Sprint ============

export const behindScheduleSprintProps: SprintSummaryTabProps = {
  ...sampleSprintSummaryProps,
  sprintName: 'Sprint 10 - Critical Fixes',
  metrics: {
    ...sampleMetrics,
    totalStoryPoints: 50,
    completedStoryPoints: 20,
    burndownTrend: [
      { dayLabel: 'Day 1', remainingPoints: 50 },
      { dayLabel: 'Day 2', remainingPoints: 48 },
      { dayLabel: 'Day 3', remainingPoints: 47 },
      { dayLabel: 'Day 4', remainingPoints: 45 },
      { dayLabel: 'Day 5', remainingPoints: 42 },
      { dayLabel: 'Day 6', remainingPoints: 40 },
      { dayLabel: 'Day 7', remainingPoints: 38 },
      { dayLabel: 'Day 8', remainingPoints: 35 },
      { dayLabel: 'Day 9', remainingPoints: 32 },
      { dayLabel: 'Day 10', remainingPoints: 30 },
    ],
    burndownStatus: 'behind',
    newBugs: 8,
    resolvedBugs: 3,
  },
  blockers: [
    ...sampleBlockers,
    {
      id: 'blocker-3',
      title: 'Critical production bug needs immediate fix',
      description: 'Payment processing failing for 10% of users',
      ownerName: 'Nguyen Van A',
      severity: 'high',
    },
  ],
};

// ============ Demo Component ============

const SprintSummaryTabDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Demo Header */}
      <div className='bg-white border-b px-6 py-4'>
        <h1 className='text-2xl font-bold'>Sprint Summary Tab - Demo</h1>
        <p className='text-muted-foreground'>Hiển thị data mẫu cho component SprintSummaryTab</p>
      </div>

      {/* Main Demo - Active Sprint */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full'>
            Active Sprint Example
          </span>
        </div>
        <SprintSummaryTab {...sampleSprintSummaryProps} />
      </div>

      {/* Separator */}
      <div className='border-t-4 border-dashed border-gray-300 my-8' />

      {/* Completed Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full'>
            Completed Sprint Example
          </span>
        </div>
        <SprintSummaryTab {...completedSprintProps} />
      </div>

      {/* Separator */}
      <div className='border-t-4 border-dashed border-gray-300 my-8' />

      {/* Upcoming Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full'>
            Upcoming Sprint Example
          </span>
        </div>
        <SprintSummaryTab {...upcomingSprintProps} />
      </div>

      {/* Separator */}
      <div className='border-t-4 border-dashed border-gray-300 my-8' />

      {/* Behind Schedule Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full'>
            Behind Schedule Sprint Example
          </span>
        </div>
        <SprintSummaryTab {...behindScheduleSprintProps} />
      </div>
    </div>
  );
};

export default SprintSummaryTabDemo;
