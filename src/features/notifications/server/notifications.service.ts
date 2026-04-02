import { prisma } from '@/lib/prisma';
import { ensureCan } from '@/features/organization/utils/authz';
import type { NotificationCreateInput, NotificationListQuery, NotificationSnoozeInput } from '@/contracts/notifications';
import { ZNotification } from '@/contracts/notifications';

export type NotificationServiceContext = { actorId: string };

const list = async (
  orgId: string,
  query: NotificationListQuery,
  context: NotificationServiceContext,
) => {
  await ensureCan('read', { kind: 'org', id: orgId, attr: { orgId } }, { actorId: context.actorId });

  const where: Record<string, unknown> = {
    organizationId: orgId,
    receiverId: context.actorId,
  };

  switch (query.type) {
    case 'read':
      where.readAt = { not: null };
      where.archivedAt = null;
      break;
    case 'unread':
      where.readAt = null;
      where.archivedAt = null;
      break;
    case 'archived':
      where.archivedAt = { not: null };
      break;
    case 'snoozed':
      where.snoozedUntil = { not: null };
      where.archivedAt = null;
      break;
    case 'all':
    default:
      where.archivedAt = null;
      break;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    }),
    prisma.notification.count({ where }),
  ]);

  const data = notifications.map((n) => ZNotification.parse(n));
  return { data, meta: { total } };
};

const getUnreadCount = async (orgId: string, context: NotificationServiceContext) => {
  await ensureCan('read', { kind: 'org', id: orgId, attr: { orgId } }, { actorId: context.actorId });

  const total = await prisma.notification.count({
    where: {
      organizationId: orgId,
      receiverId: context.actorId,
      readAt: null,
      archivedAt: null,
    },
  });

  return { total };
};

const markRead = async (notificationId: string, context: NotificationServiceContext) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId, receiverId: context.actorId },
  });
  if (!notification) throw new Error('Notification not found');

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
    include: { actor: { select: { id: true, name: true, avatar: true } } },
  });

  return ZNotification.parse(updated);
};

const markUnread = async (notificationId: string, context: NotificationServiceContext) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId, receiverId: context.actorId },
  });
  if (!notification) throw new Error('Notification not found');

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: null },
    include: { actor: { select: { id: true, name: true, avatar: true } } },
  });

  return ZNotification.parse(updated);
};

const archive = async (notificationId: string, context: NotificationServiceContext) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId, receiverId: context.actorId },
  });
  if (!notification) throw new Error('Notification not found');

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { archivedAt: new Date() },
    include: { actor: { select: { id: true, name: true, avatar: true } } },
  });

  return ZNotification.parse(updated);
};

const snooze = async (
  notificationId: string,
  input: NotificationSnoozeInput,
  context: NotificationServiceContext,
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId, receiverId: context.actorId },
  });
  if (!notification) throw new Error('Notification not found');

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { snoozedUntil: new Date(input.snoozedUntil) },
    include: { actor: { select: { id: true, name: true, avatar: true } } },
  });

  return ZNotification.parse(updated);
};

const markAllRead = async (orgId: string, context: NotificationServiceContext) => {
  await ensureCan('read', { kind: 'org', id: orgId, attr: { orgId } }, { actorId: context.actorId });

  const result = await prisma.notification.updateMany({
    where: {
      organizationId: orgId,
      receiverId: context.actorId,
      readAt: null,
      archivedAt: null,
    },
    data: { readAt: new Date() },
  });

  return { count: result.count };
};

const create = async (input: NotificationCreateInput) => {
  const notification = await prisma.notification.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      issueId: input.issueId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      actorId: input.actorId,
      receiverId: input.receiverId,
    },
    include: {
      actor: { select: { id: true, name: true, avatar: true } },
    },
  });

  return ZNotification.parse(notification);
};

export const notificationsService = {
  list,
  getUnreadCount,
  markRead,
  markUnread,
  archive,
  snooze,
  markAllRead,
  create,
};
