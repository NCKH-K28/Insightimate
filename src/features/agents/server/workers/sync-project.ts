/* eslint-disable @typescript-eslint/no-unused-vars */

import { kafka } from '@/lib/kafka';
import { prisma } from '@/lib/prisma';

const TOPIC = 'pg.public.projects';
const GROUP_ID = 'cdc-consumer';
const FROM_BEGINNING = true;

// workers/sync-project.ts
export async function syncProject() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });

  const shutdown = async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await consumer.connect();

  await consumer.subscribe({ topic: TOPIC, fromBeginning: FROM_BEGINNING });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      return;
      const raw = message.value?.toString() ?? '{}';
      try {
        const evt = JSON.parse(raw);
        const after = evt.payload.after;
        const op = evt.payload.op;
        if (op === 'd') {
          const sourceId = evt.payload.before.id;
          if (!sourceId) {
            console.warn('Missing sourceId in delete event:', evt);
            return;
          }

          await prisma.dataSource.deleteMany({
            where: { sourceType: 'PROJECT', sourceId: sourceId },
          });
        } else if (op === 'u') {
          const sourceId = after.id;
          if (!sourceId) {
            console.warn('Missing sourceId in update event:', evt);
            return;
          }

          await prisma.dataSource.updateMany({
            where: { sourceType: 'PROJECT', sourceId: sourceId },
            data: { snapshot: { name: after.name, description: after.description } },
          });
        }
      } catch {
        console.warn('Non-JSON message:', raw);
      }
    },
  });
}
