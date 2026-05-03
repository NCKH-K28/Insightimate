import { z } from 'zod';
import {
  POKER_DECK_TYPES,
  POKER_HOST_MODES,
  POKER_STORY_PRIORITIES,
} from '../types';

export const ZPokerStoryCreateInput = z.object({
  code: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  description: z.string().max(4000).optional(),
  priority: z.enum(POKER_STORY_PRIORITIES).default('UNESTIMATED'),
  tags: z.array(z.string()).optional(),
  issueId: z.string().optional(),
});
export type PokerStoryCreateInput = z.infer<typeof ZPokerStoryCreateInput>;

export const ZPokerStoryBulkCreateInput = z.object({
  stories: z.array(ZPokerStoryCreateInput).min(1),
});
export type PokerStoryBulkCreateInput = z.infer<typeof ZPokerStoryBulkCreateInput>;

export const ZPokerSessionCreateApiInput = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(120),
  deckType: z.enum(POKER_DECK_TYPES),
  hostMode: z.enum(POKER_HOST_MODES),
  hostUserId: z.string().optional(),
});
export type PokerSessionCreateApiInput = z.infer<typeof ZPokerSessionCreateApiInput>;

export const ZPokerVoteSubmitInput = z.object({
  value: z.string().min(1).max(8),
});
export type PokerVoteSubmitInput = z.infer<typeof ZPokerVoteSubmitInput>;

export const ZPokerSessionStartInput = z.object({
  storyId: z.string().min(1),
});
export type PokerSessionStartInput = z.infer<typeof ZPokerSessionStartInput>;

export const ZPokerStoryRevealInput = z.object({
  finalPoints: z.number().optional(),
});
export type PokerStoryRevealInput = z.infer<typeof ZPokerStoryRevealInput>;
