// lib/prisma-notify-extension.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { Client as PgClient, Notification as PgNotification } from 'pg';

const LOG_PREFIX = '[prisma-notify-trigger]';
const getMsg = (msg: string) => `${LOG_PREFIX} ${msg}`;

/** ---------- Utils ---------- */
const sanitizeIdentifier = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_');

const escapeSqlLiteral = (s: string) => s.replace(/'/g, "''");

/** ---------- SQL generator ---------- */
const createPubTriggerSQL = (params: {
  channel: string;
  op?: { insert?: boolean; update?: boolean; delete?: boolean };
  /** real table name, may include schema or quotes */
  model: string;
}) => {
  const operations: string[] = [];
  if (params.op?.insert ?? true) operations.push('INSERT');
  if (params.op?.update ?? true) operations.push('UPDATE');
  if (params.op?.delete ?? true) operations.push('DELETE');

  const fnName = `pub_${sanitizeIdentifier(params.model)}_change`;
  const trgName = `trg_${sanitizeIdentifier(params.model)}_change`;
  const channelLit = escapeSqlLiteral(params.channel);

  return `
CREATE OR REPLACE FUNCTION ${fnName}() RETURNS trigger AS $$
DECLARE payload json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload := json_build_object('op', TG_OP, 'record', row_to_json(OLD));
  ELSE
    payload := json_build_object('op', TG_OP, 'record', row_to_json(NEW));
  END IF;
  PERFORM pg_notify('${channelLit}', payload::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ${trgName} ON ${params.model};
CREATE TRIGGER ${trgName}
AFTER ${operations.join(' OR ')} ON ${params.model}
FOR EACH ROW EXECUTE FUNCTION ${fnName}();
`;
};

export const checkTableExists = (
  tableName: string,
  prisma: { $queryRaw: PrismaClient['$queryRaw'] },
): Promise<boolean> => {
  return prisma.$queryRaw<Array<{ exists: boolean }>>`SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = ${tableName}
    ) AS "exists";`.then((res) => res.length > 0 && res[0].exists);
};

/** ---------- PG client (singleton) ---------- */
const parseDbUrl = (connectionString: string) => {
  const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/([^\s?]+)(?:\?(.+))?$/;
  const match = connectionString.match(regex);
  if (!match) throw new Error('Invalid PostgreSQL connection string format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
};

const getPgClient = async (connectionString: string): Promise<PgClient> => {
  const globalForPg = globalThis as unknown as any;
  let { globalPg } = globalForPg;
  if (globalPg) return globalPg;
  const parsed = parseDbUrl(connectionString);
  const client = new PgClient({ ...parsed, ssl: { rejectUnauthorized: false } });
  await client.connect();
  globalForPg.globalPg = client;
  return client;
};

/** ---------- Types ---------- */
type Operation = 'INSERT' | 'UPDATE' | 'DELETE';
export type OnMessageFn = (payload: { op: Operation; record?: any; id?: string }) => void;

export type ListenerOptions = {
  /** Ví dụ: 'post_changes' */
  channel: string;
  operations?: { insert?: boolean; update?: boolean; delete?: boolean };
  /** Tên bảng thực trong PG; có thể kèm schema. Mặc định dùng model name của Prisma */
  model?: string;
};

export type WithTriggerOptions = {
  connectionString: string;
  models: {
    [K in Prisma.ModelName]?: ListenerOptions;
  };
};

/** ---------- Extension factory ---------- */
export function withTrigger(opts: WithTriggerOptions) {
  // Bộ nhớ tạm cho mỗi kênh
  const listenersByChannel = new Map<string, Set<OnMessageFn>>();
  const channelHandler = new Map<string, (msg: PgNotification) => void>();
  const listenedChannels = new Set<string>();

  const ensureListenOnChannel = async (pg: PgClient, channel: string) => {
    if (listenedChannels.has(channel)) return;

    const handler = (msg: PgNotification) => {
      if (msg.channel !== channel) return;
      const set = listenersByChannel.get(channel);
      if (!set || set.size === 0 || !msg.payload) return;

      try {
        const payload = JSON.parse(msg.payload);
        for (const fn of set) fn(payload);
      } catch {
        console.error(getMsg(`Không thể phân tích payload từ kênh "${channel}": ${msg.payload}`));
      }
    };

    await pg.query(`LISTEN "${channel}"`);
    pg.on('notification', handler);
    listenedChannels.add(channel);
    channelHandler.set(channel, handler);
  };

  const maybeUnlistenChannel = async (pg: PgClient, channel: string) => {
    const set = listenersByChannel.get(channel);
    if (set && set.size > 0) return; // vẫn còn người nghe

    // không còn ai nghe -> tháo handler và UNLISTEN
    const handler = channelHandler.get(channel);
    if (handler) {
      pg.off('notification', handler);
      channelHandler.delete(channel);
    }
    if (listenedChannels.has(channel)) {
      await pg.query(`UNLISTEN "${channel}"`);
      listenedChannels.delete(channel);
    }
  };

  return Prisma.defineExtension((prisma) =>
    prisma.$extends({
      name: 'prisma-notify-trigger',
      client: {
        async listen(
          model: Prisma.ModelName,
          onMessage: OnMessageFn,
        ): Promise<() => Promise<void>> {
          const cfg = opts.models[model];
          if (!cfg) {
            throw new Error(getMsg(`Model "${model}" không được cấu hình để lắng nghe`));
          }

          const tableName = cfg.model ?? `"${String(model)}"`; // bảng mặc định = tên model, được quote
          const tableExists = await checkTableExists(tableName, prisma);
          if (!tableExists) {
            throw new Error(getMsg(`Bảng "${tableName}" không tồn tại trong cơ sở dữ liệu`));
          }

          const pg = await getPgClient(opts.connectionString);

          const triggerSQL = createPubTriggerSQL({
            channel: cfg.channel,
            op: cfg.operations,
            model: tableName,
          });

          await pg.query(triggerSQL);

          await ensureListenOnChannel(pg, cfg.channel);

          const set = listenersByChannel.get(cfg.channel) ?? new Set<OnMessageFn>();
          set.add(onMessage);
          listenersByChannel.set(cfg.channel, set);

          // Trả về unsubscribe
          return async () => {
            const cur = listenersByChannel.get(cfg.channel);
            if (cur) {
              cur.delete(onMessage);
              if (cur.size === 0) listenersByChannel.delete(cfg.channel);
            }
            await maybeUnlistenChannel(pg, cfg.channel);
          };
        },
      },
    }),
  );
}
