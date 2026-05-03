import type {
  PokerBacklogStory,
  PokerHostCandidate,
  PokerParticipant,
  PokerVotingStory,
} from '../types';

export const MOCK_HOST: PokerHostCandidate = {
  id: 'host',
  name: 'Alex Rivera',
  email: 'alex@architect.app',
};

export const MOCK_BACKLOG: PokerBacklogStory[] = [
  {
    id: 'jira-101',
    code: 'JIRA-101',
    title: 'Implement OAuth2 authentication flow',
    description:
      'Develop a secure authentication layer using industry-standard OAuth2 protocols to enable third-party integrations and SSO capabilities across the enterprise dashboard.',
    priority: 'HIGH',
    tags: ['Sprint 4', 'Architecture'],
    assignees: [
      { id: 'jd', name: 'Jane Doe' },
      { id: 'al', name: 'Alex Rivera' },
    ],
  },
  {
    id: 'jira-104',
    code: 'JIRA-104',
    title: 'Optimize WebSocket connection latency',
    description:
      'Investigate and resolve packet loss issues in real-time voting sync to ensure sub-100ms response times for global distributed teams during poker sessions.',
    priority: 'MEDIUM',
    tags: ['Sprint 4'],
    assignees: [{ id: 'mk', name: 'Minh Khoi' }],
  },
  {
    id: 'jira-205',
    code: 'JIRA-205',
    title: 'Refactor reporting dashboard UI',
    description:
      'Migrate the legacy D3.js charts to a modern React-based visualization library to improve mobile responsiveness and overall interactive performance.',
    priority: 'UNESTIMATED',
    tags: ['Architecture'],
  },
  {
    id: 'jira-301',
    code: 'JIRA-301',
    title: 'Update privacy policy documentation',
    description:
      'Revise the application’s internal privacy guidelines to align with new GDPR compliance updates for the upcoming European market expansion.',
    priority: 'LOW',
  },
];

export const MOCK_VOTING_STORY: PokerVotingStory = {
  code: 'JIRA-1024',
  title: 'Implement Real-time Synchronization for Voting Hand',
  description:
    'As a developer, I want my selected Fibonacci card to be visible to the host immediately, so that the estimation process remains fluid and collaborative without manual refreshing.',
  source: 'Sprint Backlog',
  pointTarget: 8,
};

export const MOCK_PARTICIPANTS: PokerParticipant[] = [
  { id: 'p1', name: 'Sarah Jenkins', role: 'Frontend Lead', status: 'READY' },
  { id: 'p2', name: 'Marcus Thorne', role: 'Product Owner', status: 'READY' },
  { id: 'p3', name: 'David Lee', role: 'QA Engineer', status: 'THINKING' },
  { id: 'p4', name: 'Elena Gomez', role: 'UX Designer', status: 'THINKING' },
  { id: 'p5', name: 'Sophia Chen', role: 'DevOps', status: 'THINKING' },
];
