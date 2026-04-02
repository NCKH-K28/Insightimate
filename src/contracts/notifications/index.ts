import { z } from 'zod';
import { isoString } from '../_shared';

// ===== Notification Schemas =====

export const ZNotification = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullable(),
  issueId: z.string().nullable(),
  type: z.string(),
  title: z.string(),
  message: z.string().nullable(),
  data: z.any().nullable(),
  actorId: z.string().nullable(),
  receiverId: z.string(),
  readAt: isoString.nullable(),
  snoozedUntil: isoString.nullable(),
  archivedAt: isoString.nullable(),
  createdAt: isoString,
  updatedAt: isoString,
  actor: z
    .object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().nullish(),
    })
    .nullish(),
});

export type Notification = z.infer<typeof ZNotification>;

export const ZNotificationList = z.object({
  data: z.array(ZNotification),
  meta: z.object({ total: z.number() }),
});

export const ZNotificationUnreadCount = z.object({
  total: z.number(),
});

export const ZNotificationSnoozeInput = z.object({
  snoozedUntil: z.string().datetime(),
});

export type NotificationSnoozeInput = z.infer<typeof ZNotificationSnoozeInput>;

// ===== Notification List Filters =====

export const ZNotificationListQuery = z.object({
  type: z.enum(['read', 'unread', 'archived', 'snoozed', 'all']).default('all'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type NotificationListQuery = z.infer<typeof ZNotificationListQuery>;

// ===== Notification Preferences =====

export const ZNotificationPreference = z.object({
  id: z.string(),
  userId: z.string(),
  emailMentions: z.boolean(),
  emailAssignments: z.boolean(),
  emailUpdates: z.boolean(),
});

export type NotificationPreference = z.infer<typeof ZNotificationPreference>;

export const ZNotificationPreferenceUpdate = z.object({
  emailMentions: z.boolean().optional(),
  emailAssignments: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
});

export type NotificationPreferenceUpdate = z.infer<typeof ZNotificationPreferenceUpdate>;

// ===== Internal: Create Notification Input (used by services) =====

export const ZNotificationCreateInput = z.object({
  organizationId: z.string(),
  projectId: z.string().optional(),
  issueId: z.string().optional(),
  type: z.string(),
  title: z.string(),
  message: z.string().optional(),
  data: z.any().optional(),
  actorId: z.string().optional(),
  receiverId: z.string(),
});

export type NotificationCreateInput = z.infer<typeof ZNotificationCreateInput>;
