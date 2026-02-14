import { z } from 'zod';

// ==================== Enums ====================

export const ZActivityAction = z.enum([
  'CREATED',
  'UPDATED',
  'DELETED',
  'MOVED',
  'ASSIGNED',
  'UNASSIGNED',
  'COMMENTED',
  'LOGGED_TIME',
  'STATUS_CHANGED',
  'SPRINT_STARTED',
  'SPRINT_CLOSED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'ROLE_CHANGED',
]);
export type ActivityAction = z.infer<typeof ZActivityAction>;

export const ZActivityEntity = z.enum([
  'PROJECT',
  'ISSUE',
  'SPRINT',
  'COMMENT',
  'TEAM',
  'ORGANIZATION',
]);
export type ActivityEntity = z.infer<typeof ZActivityEntity>;

// ==================== Event Schema ====================

export const ZActivityEvent = z.object({
  id: z.string(),
  orgId: z.string(),
  projectId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  actorType: z.string(),
  action: ZActivityAction,
  entity: ZActivityEntity,
  entityId: z.string(),
  entityKey: z.string().nullable(),
  entityTitle: z.string().nullable(),
  changes: z.any().nullable(),
  metadata: z.any().nullable(),
  groupKey: z.string().nullable(),
  createdAt: z.string(),
});
export type ActivityEvent = z.infer<typeof ZActivityEvent>;

// ==================== Enriched Event (with actor details) ====================

export const ZActivityEventWithActor = ZActivityEvent.extend({
  actor: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type ActivityEventWithActor = z.infer<typeof ZActivityEventWithActor>;

// ==================== Query & Response ====================

export const ZActivityFeedQuery = z.object({
  orgId: z.string(),
  projectId: z.string().optional(),
  entity: ZActivityEntity.optional(),
  action: ZActivityAction.optional(),
  actorId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
});
export type ActivityFeedQuery = z.infer<typeof ZActivityFeedQuery>;

export const ZActivityFeedResponse = z.object({
  items: z.array(ZActivityEventWithActor),
  nextCursor: z.string().nullable(),
});
export type ActivityFeedResponse = z.infer<typeof ZActivityFeedResponse>;
