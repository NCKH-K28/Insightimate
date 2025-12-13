import SprintReportsTab, {
  SprintReportsTabProps,
  BurndownPoint,
  BurnupPoint,
  ScopeChangeEvent,
  ThroughputPoint,
  CycleTimeBucket,
  BugTrendPoint,
  BugSummaryItem,
  CarryoverIssue,
  SprintBurndownMetrics,
  SprintScopeMetrics,
  SprintFlowMetrics,
  SprintQualityMetrics,
  SprintOutcomeSummary,
  SprintComparisonSummary,
} from './tabs/reports-tab';

// ============ Sample Burndown Data ============

const sampleBurndownPoints: BurndownPoint[] = [
  { date: '2025-12-01', dayLabel: 'Day 1', remainingPoints: 45, idealRemainingPoints: 45 },
  { date: '2025-12-02', dayLabel: 'Day 2', remainingPoints: 42, idealRemainingPoints: 41 },
  { date: '2025-12-03', dayLabel: 'Day 3', remainingPoints: 38, idealRemainingPoints: 36 },
  { date: '2025-12-04', dayLabel: 'Day 4', remainingPoints: 35, idealRemainingPoints: 32 },
  { date: '2025-12-05', dayLabel: 'Day 5', remainingPoints: 30, idealRemainingPoints: 27 },
  { date: '2025-12-06', dayLabel: 'Day 6', remainingPoints: 25, idealRemainingPoints: 23 },
  {
    date: '2025-12-07',
    dayLabel: 'Day 7',
    remainingPoints: 20,
    idealRemainingPoints: 18,
    isToday: true,
  },
  { date: '2025-12-08', dayLabel: 'Day 8', remainingPoints: 15, idealRemainingPoints: 14 },
  { date: '2025-12-09', dayLabel: 'Day 9', remainingPoints: 10, idealRemainingPoints: 9 },
  { date: '2025-12-10', dayLabel: 'Day 10', remainingPoints: 5, idealRemainingPoints: 5 },
];

const sampleBurndown: SprintBurndownMetrics = {
  burndownPoints: sampleBurndownPoints,
  status: 'onTrack',
  remainingAtEnd: 5,
  daysWithoutProgress: 1,
  completionPercentage: 89,
  keyTakeaways: [
    'Team velocity is consistent with previous sprints',
    'One blocker resolved mid-sprint helped acceleration',
    'Daily standups effectively identified impediments early',
    'Code review turnaround improved by 30%',
  ],
  quickSummary:
    'Sprint is progressing well with 89% completion. The team maintained steady velocity despite one major blocker in the first week.',
};

// ============ Sample Burnup & Scope Data ============

const sampleBurnupPoints: BurnupPoint[] = [
  { date: '2025-12-01', dayLabel: 'Day 1', completedPoints: 0, totalScopePoints: 45 },
  { date: '2025-12-02', dayLabel: 'Day 2', completedPoints: 3, totalScopePoints: 45 },
  { date: '2025-12-03', dayLabel: 'Day 3', completedPoints: 7, totalScopePoints: 48 },
  { date: '2025-12-04', dayLabel: 'Day 4', completedPoints: 12, totalScopePoints: 48 },
  { date: '2025-12-05', dayLabel: 'Day 5', completedPoints: 18, totalScopePoints: 50 },
  { date: '2025-12-06', dayLabel: 'Day 6', completedPoints: 23, totalScopePoints: 50 },
  { date: '2025-12-07', dayLabel: 'Day 7', completedPoints: 28, totalScopePoints: 50 },
  { date: '2025-12-08', dayLabel: 'Day 8', completedPoints: 35, totalScopePoints: 50 },
  { date: '2025-12-09', dayLabel: 'Day 9', completedPoints: 40, totalScopePoints: 50 },
  { date: '2025-12-10', dayLabel: 'Day 10', completedPoints: 45, totalScopePoints: 50 },
];

const sampleScopeChangeEvents: ScopeChangeEvent[] = [
  {
    id: 'sc-1',
    date: '2025-12-03',
    type: 'added',
    issueKey: 'PROJ-201',
    issueTitle: 'Add password strength indicator to signup form',
    storyPointsDelta: 3,
    reason: 'Security team requirement',
  },
  {
    id: 'sc-2',
    date: '2025-12-05',
    type: 'added',
    issueKey: 'PROJ-205',
    issueTitle: 'Fix critical payment gateway timeout issue',
    storyPointsDelta: 2,
    reason: 'Production hotfix needed',
  },
  {
    id: 'sc-3',
    date: '2025-12-05',
    type: 'removed',
    issueKey: 'PROJ-195',
    issueTitle: 'Implement social media sharing feature',
    storyPointsDelta: 5,
    reason: 'Deprioritized to next sprint',
  },
  {
    id: 'sc-4',
    date: '2025-12-06',
    type: 'added',
    issueKey: 'PROJ-208',
    issueTitle: 'Add loading skeleton for dashboard widgets',
    storyPointsDelta: 2,
    reason: 'UX improvement request',
  },
];

const sampleScope: SprintScopeMetrics = {
  initialScopePoints: 45,
  finalScopePoints: 50,
  pointsAdded: 10,
  pointsRemoved: 5,
  burnupPoints: sampleBurnupPoints,
  scopeChangeEvents: sampleScopeChangeEvents,
};

// ============ Sample Flow Metrics Data ============

const sampleThroughput: ThroughputPoint[] = [
  { date: '2025-12-01', dayLabel: 'Day 1', completed: 0 },
  { date: '2025-12-02', dayLabel: 'Day 2', completed: 2 },
  { date: '2025-12-03', dayLabel: 'Day 3', completed: 3 },
  { date: '2025-12-04', dayLabel: 'Day 4', completed: 2 },
  { date: '2025-12-05', dayLabel: 'Day 5', completed: 4 },
  { date: '2025-12-06', dayLabel: 'Day 6', completed: 3 },
  { date: '2025-12-07', dayLabel: 'Day 7', completed: 2 },
  { date: '2025-12-08', dayLabel: 'Day 8', completed: 3 },
  { date: '2025-12-09', dayLabel: 'Day 9', completed: 2 },
  { date: '2025-12-10', dayLabel: 'Day 10', completed: 1 },
];

const sampleCycleTimeBuckets: CycleTimeBucket[] = [
  { bucketLabel: '0-1d', count: 5 },
  { bucketLabel: '1-2d', count: 8 },
  { bucketLabel: '2-3d', count: 4 },
  { bucketLabel: '3-5d', count: 3 },
  { bucketLabel: '>5d', count: 2 },
];

const sampleFlow: SprintFlowMetrics = {
  throughput: sampleThroughput,
  averageCycleTimeDays: 2.1,
  medianCycleTimeDays: 1.8,
  p85CycleTimeDays: 3.5,
  cycleTimeBuckets: sampleCycleTimeBuckets,
};

// ============ Sample Quality Metrics Data ============

const sampleBugTrend: BugTrendPoint[] = [
  { date: '2025-12-01', dayLabel: 'Day 1', created: 0, resolved: 0 },
  { date: '2025-12-02', dayLabel: 'Day 2', created: 2, resolved: 0 },
  { date: '2025-12-03', dayLabel: 'Day 3', created: 1, resolved: 2 },
  { date: '2025-12-04', dayLabel: 'Day 4', created: 0, resolved: 1 },
  { date: '2025-12-05', dayLabel: 'Day 5', created: 2, resolved: 1 },
  { date: '2025-12-06', dayLabel: 'Day 6', created: 1, resolved: 2 },
  { date: '2025-12-07', dayLabel: 'Day 7', created: 0, resolved: 1 },
  { date: '2025-12-08', dayLabel: 'Day 8', created: 1, resolved: 2 },
  { date: '2025-12-09', dayLabel: 'Day 9', created: 0, resolved: 1 },
  { date: '2025-12-10', dayLabel: 'Day 10', created: 0, resolved: 1 },
];

const sampleBugSummary: BugSummaryItem[] = [
  {
    id: 'bug-1',
    key: 'PROJ-210',
    title: 'Payment fails intermittently on mobile Safari',
    severity: 'critical',
    daysOpen: 3,
    status: 'inProgress',
  },
  {
    id: 'bug-2',
    key: 'PROJ-212',
    title: 'Dashboard chart tooltips cut off on small screens',
    severity: 'high',
    daysOpen: 2,
    status: 'open',
  },
  {
    id: 'bug-3',
    key: 'PROJ-215',
    title: 'Session timeout not triggering logout correctly',
    severity: 'high',
    daysOpen: 4,
    status: 'resolved',
  },
  {
    id: 'bug-4',
    key: 'PROJ-218',
    title: 'Form validation error message overlaps submit button',
    severity: 'medium',
    daysOpen: 1,
    status: 'open',
  },
  {
    id: 'bug-5',
    key: 'PROJ-220',
    title: 'Minor typo in confirmation email template',
    severity: 'low',
    daysOpen: 5,
    status: 'closed',
  },
  {
    id: 'bug-6',
    key: 'PROJ-222',
    title: 'Avatar image not loading for new users',
    severity: 'medium',
    daysOpen: 2,
    status: 'inProgress',
  },
];

const sampleQuality: SprintQualityMetrics = {
  bugTrend: sampleBugTrend,
  bugSummary: sampleBugSummary,
  totalBugsCreated: 7,
  totalBugsResolved: 11,
  netBugChange: -4,
  bugWorkRatio: 0.15,
};

// ============ Sample Outcome Data ============

const sampleCarryoverIssues: CarryoverIssue[] = [
  {
    id: 'carry-1',
    key: 'PROJ-188',
    title: 'Implement advanced search with filters',
    statusAtEnd: 'inProgress',
    storyPoints: 5,
    reasonCategory: 'underestimated',
  },
  {
    id: 'carry-2',
    key: 'PROJ-192',
    title: 'Add bulk export functionality for reports',
    statusAtEnd: 'todo',
    storyPoints: 3,
    reasonCategory: 'deprioritized',
  },
];

const sampleOutcome: SprintOutcomeSummary = {
  goalOutcome: 'partiallyAchieved',
  goalDescription:
    'Complete the user authentication overhaul and deliver the initial payment gateway integration.',
  narrativeSummary:
    'Sprint 15 delivered 90% of planned work. Authentication overhaul completed successfully.Payment gateway integration is functional but two minor features were carried over due to underestimation. Overall team performance was strong with improved collaboration.',
  keyLearnings: [
    'Complex integrations need more detailed estimation sessions',
    'Early QA involvement reduced bug escape rate significantly',
    'Pair programming on critical features improved code quality',
    'Daily async updates worked well for remote team members',
  ],
  actionItems: [
    'Schedule estimation workshop for integration stories',
    'Create runbook for payment gateway troubleshooting',
    'Set up automated smoke tests for auth flows',
    'Document new authentication architecture for team wiki',
  ],
  carryoverIssues: sampleCarryoverIssues,
  carryoverPoints: 8,
  carryoverIssueCount: 2,
};

// ============ Sample Comparison Data ============

const sampleComparison: SprintComparisonSummary = {
  currentVelocityPoints: 42,
  previousVelocityPoints: 38,
  velocityDeltaPoints: 4,
  velocityTrend: 'up',
  comparisonSprintName: 'Sprint 14',
  availableSprints: ['Sprint 14', 'Sprint 13', 'Sprint 12', 'Sprint 11'],
};

// ============ Complete Sample Props - Active Sprint ============

export const sampleSprintReportsProps: SprintReportsTabProps = {
  sprintName: 'Sprint 15 - Q4 Release',
  startDate: '2025-12-01',
  endDate: '2025-12-14',
  status: 'active',

  unitMode: 'storyPoints',
  granularityMode: 'daily',

  comparison: sampleComparison,
  burndown: sampleBurndown,
  flow: sampleFlow,
  scope: sampleScope,
  quality: sampleQuality,
  outcome: sampleOutcome,

  onUnitModeChange: (mode) => console.log('Unit mode changed:', mode),
  onGranularityModeChange: (mode) => console.log('Granularity changed:', mode),
  onComparisonSprintChange: (sprint) => console.log('Compare to:', sprint),
  onOpenFlowDetails: () => {
    console.log('Open flow details');
    alert('Opening Flow Details...');
  },
  onOpenBugsDetails: () => {
    console.log('Open bugs details');
    alert('Opening Bugs Details...');
  },
  onExportCsv: () => {
    console.log('Export CSV');
    alert('Exporting to CSV...');
  },
  onExportPdf: () => {
    console.log('Export PDF');
    alert('Exporting to PDF...');
  },
};

// ============ Completed Sprint (Goal Achieved) ============

export const completedSprintReportsProps: SprintReportsTabProps = {
  sprintName: 'Sprint 14 - Authentication',
  startDate: '2025-11-17',
  endDate: '2025-11-30',
  status: 'completed',

  unitMode: 'storyPoints',
  granularityMode: 'daily',

  comparison: {
    currentVelocityPoints: 38,
    previousVelocityPoints: 35,
    velocityDeltaPoints: 3,
    velocityTrend: 'up',
    comparisonSprintName: 'Sprint 13',
    availableSprints: ['Sprint 13', 'Sprint 12', 'Sprint 11'],
  },

  burndown: {
    burndownPoints: [
      { date: '2025-11-17', dayLabel: 'Day 1', remainingPoints: 38, idealRemainingPoints: 38 },
      { date: '2025-11-18', dayLabel: 'Day 2', remainingPoints: 34, idealRemainingPoints: 34 },
      { date: '2025-11-19', dayLabel: 'Day 3', remainingPoints: 28, idealRemainingPoints: 30 },
      { date: '2025-11-20', dayLabel: 'Day 4', remainingPoints: 22, idealRemainingPoints: 27 },
      { date: '2025-11-21', dayLabel: 'Day 5', remainingPoints: 18, idealRemainingPoints: 23 },
      { date: '2025-11-22', dayLabel: 'Day 6', remainingPoints: 14, idealRemainingPoints: 19 },
      { date: '2025-11-23', dayLabel: 'Day 7', remainingPoints: 10, idealRemainingPoints: 15 },
      { date: '2025-11-24', dayLabel: 'Day 8', remainingPoints: 6, idealRemainingPoints: 11 },
      { date: '2025-11-25', dayLabel: 'Day 9', remainingPoints: 2, idealRemainingPoints: 8 },
      { date: '2025-11-26', dayLabel: 'Day 10', remainingPoints: 0, idealRemainingPoints: 4 },
    ],
    status: 'ahead',
    remainingAtEnd: 0,
    daysWithoutProgress: 0,
    completionPercentage: 100,
    keyTakeaways: [
      'Team exceeded velocity expectations by 10%',
      'Early completion allowed time for additional polish',
      'All acceptance criteria met with no major bugs',
      'Strong collaboration between dev and QA',
    ],
    quickSummary:
      'Exceptional sprint!  All 38 story points completed 2 days early.Team velocity improved and quality remained high.',
  },

  flow: {
    throughput: [
      { date: '2025-11-17', dayLabel: 'Day 1', completed: 0 },
      { date: '2025-11-18', dayLabel: 'Day 2', completed: 2 },
      { date: '2025-11-19', dayLabel: 'Day 3', completed: 3 },
      { date: '2025-11-20', dayLabel: 'Day 4', completed: 3 },
      { date: '2025-11-21', dayLabel: 'Day 5', completed: 2 },
      { date: '2025-11-22', dayLabel: 'Day 6', completed: 2 },
      { date: '2025-11-23', dayLabel: 'Day 7', completed: 2 },
      { date: '2025-11-24', dayLabel: 'Day 8', completed: 2 },
      { date: '2025-11-25', dayLabel: 'Day 9', completed: 2 },
      { date: '2025-11-26', dayLabel: 'Day 10', completed: 1 },
    ],
    averageCycleTimeDays: 1.6,
    medianCycleTimeDays: 1.4,
    p85CycleTimeDays: 2.5,
    cycleTimeBuckets: [
      { bucketLabel: '0-1d', count: 7 },
      { bucketLabel: '1-2d', count: 8 },
      { bucketLabel: '2-3d', count: 3 },
      { bucketLabel: '3-5d', count: 1 },
      { bucketLabel: '>5d', count: 0 },
    ],
  },

  scope: {
    initialScopePoints: 38,
    finalScopePoints: 38,
    pointsAdded: 2,
    pointsRemoved: 2,
    burnupPoints: [
      { date: '2025-11-17', dayLabel: 'Day 1', completedPoints: 0, totalScopePoints: 38 },
      { date: '2025-11-18', dayLabel: 'Day 2', completedPoints: 4, totalScopePoints: 38 },
      { date: '2025-11-19', dayLabel: 'Day 3', completedPoints: 10, totalScopePoints: 40 },
      { date: '2025-11-20', dayLabel: 'Day 4', completedPoints: 16, totalScopePoints: 38 },
      { date: '2025-11-21', dayLabel: 'Day 5', completedPoints: 20, totalScopePoints: 38 },
      { date: '2025-11-22', dayLabel: 'Day 6', completedPoints: 24, totalScopePoints: 38 },
      { date: '2025-11-23', dayLabel: 'Day 7', completedPoints: 28, totalScopePoints: 38 },
      { date: '2025-11-24', dayLabel: 'Day 8', completedPoints: 32, totalScopePoints: 38 },
      { date: '2025-11-25', dayLabel: 'Day 9', completedPoints: 36, totalScopePoints: 38 },
      { date: '2025-11-26', dayLabel: 'Day 10', completedPoints: 38, totalScopePoints: 38 },
    ],
    scopeChangeEvents: [
      {
        id: 'sc-c1',
        date: '2025-11-19',
        type: 'added',
        issueKey: 'PROJ-180',
        issueTitle: "Add 'Remember me' checkbox to login",
        storyPointsDelta: 2,
        reason: 'Quick win identified',
      },
      {
        id: 'sc-c2',
        date: '2025-11-20',
        type: 'removed',
        issueKey: 'PROJ-175',
        issueTitle: 'OAuth2 social login integration',
        storyPointsDelta: 2,
        reason: 'Third-party API not ready',
      },
    ],
  },

  quality: {
    bugTrend: [
      { date: '2025-11-17', dayLabel: 'Day 1', created: 0, resolved: 0 },
      { date: '2025-11-18', dayLabel: 'Day 2', created: 1, resolved: 0 },
      { date: '2025-11-19', dayLabel: 'Day 3', created: 1, resolved: 1 },
      { date: '2025-11-20', dayLabel: 'Day 4', created: 0, resolved: 1 },
      { date: '2025-11-21', dayLabel: 'Day 5', created: 1, resolved: 1 },
      { date: '2025-11-22', dayLabel: 'Day 6', created: 0, resolved: 1 },
      { date: '2025-11-23', dayLabel: 'Day 7', created: 0, resolved: 0 },
      { date: '2025-11-24', dayLabel: 'Day 8', created: 0, resolved: 0 },
      { date: '2025-11-25', dayLabel: 'Day 9', created: 0, resolved: 0 },
      { date: '2025-11-26', dayLabel: 'Day 10', created: 0, resolved: 0 },
    ],
    bugSummary: [
      {
        id: 'bug-c1',
        key: 'PROJ-178',
        title: 'Password reset token expiring too early',
        severity: 'high',
        daysOpen: 2,
        status: 'closed',
      },
      {
        id: 'bug-c2',
        key: 'PROJ-179',
        title: 'Login button disabled state not visible',
        severity: 'medium',
        daysOpen: 1,
        status: 'closed',
      },
      {
        id: 'bug-c3',
        key: 'PROJ-181',
        title: 'Email validation regex too strict',
        severity: 'low',
        daysOpen: 1,
        status: 'closed',
      },
    ],
    totalBugsCreated: 3,
    totalBugsResolved: 4,
    netBugChange: -1,
    bugWorkRatio: 0.08,
  },

  outcome: {
    goalOutcome: 'achieved',
    goalDescription:
      'Deliver complete authentication system with login, registration, password reset, and session management.',
    narrativeSummary:
      'Sprint 14 was a complete success!  All planned features were delivered ahead of schedule.The authentication system is fully functional and passed all security reviews. Team collaboration was excellent.',
    keyLearnings: [
      'Well-defined stories lead to faster delivery',
      'Security-focused code reviews caught issues early',
      'Pair programming accelerated knowledge sharing',
    ],
    actionItems: [
      'Document authentication architecture for new team members',
      'Create security best practices guide based on learnings',
    ],
    carryoverIssues: [],
    carryoverPoints: 0,
    carryoverIssueCount: 0,
  },

  onUnitModeChange: (mode) => console.log('Unit mode:', mode),
  onGranularityModeChange: (mode) => console.log('Granularity:', mode),
  onComparisonSprintChange: (sprint) => console.log('Compare to:', sprint),
  onExportCsv: () => console.log('Export CSV'),
  onExportPdf: () => console.log('Export PDF'),
};

// ============ Behind Schedule Sprint (Goal Not Achieved) ============

export const behindScheduleSprintReportsProps: SprintReportsTabProps = {
  sprintName: 'Sprint 13 - Infrastructure',
  startDate: '2025-11-03',
  endDate: '2025-11-16',
  status: 'completed',

  unitMode: 'storyPoints',
  granularityMode: 'daily',

  comparison: {
    currentVelocityPoints: 25,
    previousVelocityPoints: 35,
    velocityDeltaPoints: -10,
    velocityTrend: 'down',
    comparisonSprintName: 'Sprint 12',
    availableSprints: ['Sprint 12', 'Sprint 11', 'Sprint 10'],
  },

  burndown: {
    burndownPoints: [
      { date: '2025-11-03', dayLabel: 'Day 1', remainingPoints: 42, idealRemainingPoints: 42 },
      { date: '2025-11-04', dayLabel: 'Day 2', remainingPoints: 41, idealRemainingPoints: 38 },
      { date: '2025-11-05', dayLabel: 'Day 3', remainingPoints: 40, idealRemainingPoints: 34 },
      { date: '2025-11-06', dayLabel: 'Day 4', remainingPoints: 38, idealRemainingPoints: 29 },
      { date: '2025-11-07', dayLabel: 'Day 5', remainingPoints: 35, idealRemainingPoints: 25 },
      { date: '2025-11-08', dayLabel: 'Day 6', remainingPoints: 32, idealRemainingPoints: 21 },
      { date: '2025-11-09', dayLabel: 'Day 7', remainingPoints: 28, idealRemainingPoints: 17 },
      { date: '2025-11-10', dayLabel: 'Day 8', remainingPoints: 25, idealRemainingPoints: 13 },
      { date: '2025-11-11', dayLabel: 'Day 9', remainingPoints: 22, idealRemainingPoints: 8 },
      { date: '2025-11-12', dayLabel: 'Day 10', remainingPoints: 17, idealRemainingPoints: 4 },
    ],
    status: 'behind',
    remainingAtEnd: 17,
    daysWithoutProgress: 3,
    completionPercentage: 60,
    keyTakeaways: [
      'Infrastructure work was significantly underestimated',
      'External dependencies caused major blockers',
      'Team was disrupted by production incidents',
      'Need to buffer more for unknown unknowns',
    ],
    quickSummary:
      'Challenging sprint with only 60% completion.Multiple blockers and production incidents disrupted planned work.Key infrastructure improvements were started but not completed.',
  },

  flow: {
    throughput: [
      { date: '2025-11-03', dayLabel: 'Day 1', completed: 0 },
      { date: '2025-11-04', dayLabel: 'Day 2', completed: 1 },
      { date: '2025-11-05', dayLabel: 'Day 3', completed: 0 },
      { date: '2025-11-06', dayLabel: 'Day 4', completed: 1 },
      { date: '2025-11-07', dayLabel: 'Day 5', completed: 2 },
      { date: '2025-11-08', dayLabel: 'Day 6', completed: 1 },
      { date: '2025-11-09', dayLabel: 'Day 7', completed: 2 },
      { date: '2025-11-10', dayLabel: 'Day 8', completed: 1 },
      { date: '2025-11-11', dayLabel: 'Day 9', completed: 1 },
      { date: '2025-11-12', dayLabel: 'Day 10', completed: 1 },
    ],
    averageCycleTimeDays: 3.8,
    medianCycleTimeDays: 3.5,
    p85CycleTimeDays: 6.0,
    cycleTimeBuckets: [
      { bucketLabel: '0-1d', count: 2 },
      { bucketLabel: '1-2d', count: 2 },
      { bucketLabel: '2-3d', count: 3 },
      { bucketLabel: '3-5d', count: 4 },
      { bucketLabel: '>5d', count: 4 },
    ],
  },

  scope: {
    initialScopePoints: 42,
    finalScopePoints: 50,
    pointsAdded: 12,
    pointsRemoved: 4,
    burnupPoints: [
      { date: '2025-11-03', dayLabel: 'Day 1', completedPoints: 0, totalScopePoints: 42 },
      { date: '2025-11-04', dayLabel: 'Day 2', completedPoints: 1, totalScopePoints: 42 },
      { date: '2025-11-05', dayLabel: 'Day 3', completedPoints: 2, totalScopePoints: 45 },
      { date: '2025-11-06', dayLabel: 'Day 4', completedPoints: 4, totalScopePoints: 48 },
      { date: '2025-11-07', dayLabel: 'Day 5', completedPoints: 7, totalScopePoints: 48 },
      { date: '2025-11-08', dayLabel: 'Day 6', completedPoints: 10, totalScopePoints: 50 },
      { date: '2025-11-09', dayLabel: 'Day 7', completedPoints: 14, totalScopePoints: 50 },
      { date: '2025-11-10', dayLabel: 'Day 8', completedPoints: 17, totalScopePoints: 50 },
      { date: '2025-11-11', dayLabel: 'Day 9', completedPoints: 20, totalScopePoints: 50 },
      { date: '2025-11-12', dayLabel: 'Day 10', completedPoints: 25, totalScopePoints: 50 },
    ],
    scopeChangeEvents: [
      {
        id: 'sc-b1',
        date: '2025-11-05',
        type: 'added',
        issueKey: 'PROJ-160',
        issueTitle: 'Emergency security patch for CVE-2025-1234',
        storyPointsDelta: 5,
        reason: 'Critical security vulnerability',
      },
      {
        id: 'sc-b2',
        date: '2025-11-06',
        type: 'added',
        issueKey: 'PROJ-162',
        issueTitle: 'Database failover mechanism',
        storyPointsDelta: 8,
        reason: 'Production incident requirement',
      },
      {
        id: 'sc-b3',
        date: '2025-11-06',
        type: 'removed',
        issueKey: 'PROJ-155',
        issueTitle: 'CI/CD pipeline improvements',
        storyPointsDelta: 4,
        reason: 'Deprioritized due to incidents',
      },
      {
        id: 'sc-b4',
        date: '2025-11-08',
        type: 'added',
        issueKey: 'PROJ-165',
        issueTitle: 'Emergency logging enhancements',
        storyPointsDelta: 3,
        reason: 'Debugging production issues',
      },
    ],
  },

  quality: {
    bugTrend: [
      { date: '2025-11-03', dayLabel: 'Day 1', created: 2, resolved: 0 },
      { date: '2025-11-04', dayLabel: 'Day 2', created: 3, resolved: 1 },
      { date: '2025-11-05', dayLabel: 'Day 3', created: 2, resolved: 1 },
      { date: '2025-11-06', dayLabel: 'Day 4', created: 2, resolved: 2 },
      { date: '2025-11-07', dayLabel: 'Day 5', created: 1, resolved: 1 },
      { date: '2025-11-08', dayLabel: 'Day 6', created: 1, resolved: 2 },
      { date: '2025-11-09', dayLabel: 'Day 7', created: 0, resolved: 1 },
      { date: '2025-11-10', dayLabel: 'Day 8', created: 1, resolved: 1 },
      { date: '2025-11-11', dayLabel: 'Day 9', created: 0, resolved: 1 },
      { date: '2025-11-12', dayLabel: 'Day 10', created: 0, resolved: 0 },
    ],
    bugSummary: [
      {
        id: 'bug-b1',
        key: 'PROJ-158',
        title: 'Memory leak causing OOM crashes in production',
        severity: 'critical',
        daysOpen: 7,
        status: 'inProgress',
      },
      {
        id: 'bug-b2',
        key: 'PROJ-159',
        title: 'Database connection pool exhaustion',
        severity: 'critical',
        daysOpen: 5,
        status: 'resolved',
      },
      {
        id: 'bug-b3',
        key: 'PROJ-163',
        title: 'API rate limiting not working correctly',
        severity: 'high',
        daysOpen: 4,
        status: 'open',
      },
      {
        id: 'bug-b4',
        key: 'PROJ-166',
        title: 'Incorrect error codes returned on timeout',
        severity: 'medium',
        daysOpen: 3,
        status: 'inProgress',
      },
    ],
    totalBugsCreated: 12,
    totalBugsResolved: 10,
    netBugChange: 2,
    bugWorkRatio: 0.4,
  },

  outcome: {
    goalOutcome: 'notAchieved',
    goalDescription: 'Complete infrastructure migration to Kubernetes and implement auto-scaling.',
    narrativeSummary:
      'Sprint 13 faced significant challenges. Production incidents consumed 40% of capacity.Infrastructure migration started but core objectives were not met.The team needs to prioritize stability before new features.',
    keyLearnings: [
      'Production stability must be addressed before major migrations',
      'Need better incident response runbooks',
      'Scope creep from incidents severely impacted velocity',
      'Infrastructure work requires larger buffers',
      'Team burnout is a real risk during incident-heavy sprints',
    ],
    actionItems: [
      'Schedule dedicated stabilization sprint before resuming migration',
      'Create comprehensive incident response playbook',
      'Implement better monitoring to catch issues earlier',
      'Review and improve estimation for infrastructure work',
      'Consider on-call rotation to prevent team burnout',
    ],
    carryoverIssues: [
      {
        id: 'carry-b1',
        key: 'PROJ-150',
        title: 'Kubernetes cluster setup and configuration',
        statusAtEnd: 'inProgress',
        storyPoints: 8,
        reasonCategory: 'blocked',
      },
      {
        id: 'carry-b2',
        key: 'PROJ-152',
        title: 'Implement horizontal pod autoscaling',
        statusAtEnd: 'todo',
        storyPoints: 5,
        reasonCategory: 'blocked',
      },
      {
        id: 'carry-b3',
        key: 'PROJ-154',
        title: 'Database replication and failover',
        statusAtEnd: 'inProgress',
        storyPoints: 8,
        reasonCategory: 'underestimated',
      },
      {
        id: 'carry-b4',
        key: 'PROJ-156',
        title: 'Migrate staging environment to new infra',
        statusAtEnd: 'todo',
        storyPoints: 3,
        reasonCategory: 'deprioritized',
      },
    ],
    carryoverPoints: 24,
    carryoverIssueCount: 4,
  },

  onUnitModeChange: (mode) => console.log('Unit mode:', mode),
  onGranularityModeChange: (mode) => console.log('Granularity:', mode),
  onComparisonSprintChange: (sprint) => console.log('Compare to:', sprint),
  onExportCsv: () => console.log('Export CSV'),
  onExportPdf: () => console.log('Export PDF'),
};

// ============ Demo Component ============

const SprintReportsTabDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Demo Header */}
      <div className='bg-white border-b px-6 py-4'>
        <h1 className='text-2xl font-bold'>Sprint Reports Tab - Demo</h1>
        <p className='text-muted-foreground'>
          Multi-section reports với sub-tabs: Overview, Delivery, Scope, Quality, Outcome
        </p>
      </div>

      {/* Active Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full'>
            Active Sprint - On Track (Partially Achieved)
          </span>
        </div>
        <SprintReportsTab {...sampleSprintReportsProps} />
      </div>

      {/* Separator */}
      <div className='border-t-4 border-dashed border-gray-300 my-8' />

      {/* Completed Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full'>
            Completed Sprint - Ahead of Schedule (Goal Achieved)
          </span>
        </div>
        <SprintReportsTab {...completedSprintReportsProps} />
      </div>

      {/* Separator */}
      <div className='border-t-4 border-dashed border-gray-300 my-8' />

      {/* Behind Schedule Sprint Demo */}
      <div className='p-4'>
        <div className='mb-4 px-2'>
          <span className='inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full'>
            Completed Sprint - Behind Schedule (Goal Not Achieved)
          </span>
        </div>
        <SprintReportsTab {...behindScheduleSprintReportsProps} />
      </div>
    </div>
  );
};

export default SprintReportsTabDemo;
