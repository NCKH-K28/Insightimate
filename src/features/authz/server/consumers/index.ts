import { ZDebeziumPgEventSchema } from '@/lib/debezium/schema';
import kafkaClient from '@/lib/kafka';
import {
  workspaceCreatedHandler,
  workspaceDeletedHandler,
  workspaceMemberCreateHandler,
  workspaceMemberDeleteHandler,
} from './workspace-fga';

const handlers: Record<
  string,
  { c?: (data: any) => Promise<void>; d?: (data: any) => Promise<void> }
> = {
  'pg.public.workspaces': {
    c: workspaceCreatedHandler,
    d: workspaceDeletedHandler,
  },
  'pg.public.workspace_members': {
    c: workspaceMemberCreateHandler,
    d: workspaceMemberDeleteHandler,
  },
};

const toStr = (buf?: Buffer | null) => (buf ? buf.toString('utf8') : '');
export async function runConsumer() {
  const consumer = kafkaClient.consumer({ groupId: 'cdc-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'pg.public.workspaces', fromBeginning: true });
  await consumer.subscribe({ topic: 'pg.public.workspace_members', fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const key = toStr(message.key);
      const value = toStr(message.value);
      const offset = Number(message.offset);

      const prefix = `${topic}[${partition} | ${message.offset}] @${message.timestamp}`;
      console.log(prefix);
      try {
        const payload = ZDebeziumPgEventSchema.parse(value ? JSON.parse(value) : null);
        const handler = handlers[topic];
        if (!handler) {
          console.warn(`- No handler for topic ${topic}`);
          return;
        }

        if (payload.op === 'c' && handler.c) {
          await handler.c(payload.after);
        } else if (payload.op === 'd' && handler.d) {
          await handler.d(payload.before);
        } else {
          console.warn(`- No handler for operation ${payload.op} on topic ${topic}`);
        }

        await consumer.commitOffsets([{ topic, partition, offset: (offset + 1).toString() }]);
      } catch (err) {
        console.error(`! ${prefix} failed`, err);
        // TODO: DLQ hoặc throw để retry tùy chiến lược
        throw err;
      }
    },
  });

  const shutdown = async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// TODO:
// 1) map CDC event -> domain event
// 2) idempotency check (lsn/txid/event_id)
// 3) write tuples to OpenFGA (idempotent)
// 4) commit offset nếu autoCommit false
