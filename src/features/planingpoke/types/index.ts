import { z } from 'zod';

/**
 * Loại bộ bài (deck) dùng để estimate trong Planning Poker.
 */
export const POKER_DECK_TYPES = ['FIBONACCI', 'T_SHIRT', 'SEQUENTIAL'] as const;
export type PokerDeckType = (typeof POKER_DECK_TYPES)[number];

export const POKER_DECKS: Record<
  PokerDeckType,
  { id: PokerDeckType; label: string; subLabel: string; values: string[] }
> = {
  FIBONACCI: {
    id: 'FIBONACCI',
    label: '0, 1, 2…',
    subLabel: 'Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '?'],
  },
  T_SHIRT: {
    id: 'T_SHIRT',
    label: 'XS, S, M…',
    subLabel: 'T-Shirt',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
  },
  SEQUENTIAL: {
    id: 'SEQUENTIAL',
    label: '1, 2, 3…',
    subLabel: 'Sequential',
    values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?'],
  },
};

/**
 * Người điều phối (host) các task trong session.
 *  - ME: chính creator điều phối
 *  - ANOTHER: chọn 1 thành viên khác trong team
 */
export const POKER_HOST_MODES = ['ME', 'ANOTHER'] as const;
export type PokerHostMode = (typeof POKER_HOST_MODES)[number];

export const ZPokerSessionCreateInput = z
  .object({
    name: z
      .string()
      .min(1, 'Session name is required')
      .max(120, 'Session name is too long'),
    deckType: z.enum(POKER_DECK_TYPES),
    hostMode: z.enum(POKER_HOST_MODES),
    hostUserId: z.string().optional(),
  })
  .refine((data) => data.hostMode !== 'ANOTHER' || !!data.hostUserId, {
    message: 'Please pick a team member as host',
    path: ['hostUserId'],
  });

export type PokerSessionCreateInput = z.infer<typeof ZPokerSessionCreateInput>;

export type PokerHostCandidate = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

/**
 * Story / item nằm trong product backlog có thể được đưa vào session để estimate.
 */
export const POKER_STORY_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW', 'UNESTIMATED'] as const;
export type PokerStoryPriority = (typeof POKER_STORY_PRIORITIES)[number];

export type PokerBacklogStory = {
  id: string;
  /** Mã ngắn (vd: JIRA-101) */
  code: string;
  title: string;
  description?: string;
  priority: PokerStoryPriority;
  /** Tag/labels dùng cho filter (vd: Sprint 4, Architecture) */
  tags?: string[];
  /** Thành viên đã được assign vào story (avatar group) */
  assignees?: PokerHostCandidate[];
  /** Story point hiện tại (nếu đã estimate trước đó) */
  storyPoint?: number | string;
};

/**
 * Filter chips trên màn hình Product Backlog.
 */
export type PokerBacklogFilter =
  | 'ALL'
  | 'HIGH_PRIORITY'
  | 'UNESTIMATED'
  | 'SPRINT_4'
  | 'ARCHITECTURE';

export const POKER_BACKLOG_FILTERS: { id: PokerBacklogFilter; label: string }[] = [
  { id: 'ALL', label: 'All Stories' },
  { id: 'HIGH_PRIORITY', label: 'High Priority' },
  { id: 'UNESTIMATED', label: 'Unestimated' },
  { id: 'SPRINT_4', label: 'Sprint 4' },
  { id: 'ARCHITECTURE', label: 'Architecture' },
];

/**
 * Trạng thái voting của 1 participant trong session.
 */
export const POKER_VOTE_STATUSES = ['READY', 'THINKING', 'IDLE'] as const;
export type PokerVoteStatus = (typeof POKER_VOTE_STATUSES)[number];

export type PokerParticipant = PokerHostCandidate & {
  role?: string;
  status: PokerVoteStatus;
};

/**
 * Story đang được vote (active story trong voting room).
 */
export type PokerVotingStory = {
  code: string;
  title: string;
  description?: string;
  /** Hiển thị badge nguồn (vd: Sprint Backlog) */
  source?: string;
  /** Story point target (nếu có) */
  pointTarget?: number;
};
