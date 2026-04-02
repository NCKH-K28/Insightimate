import { prisma } from '@/lib/prisma';
import type { NotificationPreferenceUpdate } from '@/contracts/notifications';
import { ZNotificationPreference } from '@/contracts/notifications';

export type NotificationPreferenceContext = { actorId: string };

const get = async (context: NotificationPreferenceContext) => {
  let pref = await prisma.notificationPreference.findUnique({
    where: { userId: context.actorId },
  });

  // Return defaults if no preference exists yet
  if (!pref) {
    pref = await prisma.notificationPreference.create({
      data: { userId: context.actorId },
    });
  }

  return ZNotificationPreference.parse(pref);
};

const update = async (input: NotificationPreferenceUpdate, context: NotificationPreferenceContext) => {
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: context.actorId },
    create: {
      userId: context.actorId,
      ...input,
    },
    update: input,
  });

  return ZNotificationPreference.parse(pref);
};

export const notificationPreferencesService = {
  get,
  update,
};
