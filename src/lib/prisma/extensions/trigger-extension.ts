// lib/prisma-notify-extension.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { Client as PgClient, Notification as PgNotification } from 'pg';

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
    payload := json_build_object('op', TG_OP, 'id', OLD.id);
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

/** ---------- PG client (singleton) ---------- */
let globalPg: PgClient | null = null;

const getPgClient = async (connectionString: string): Promise<PgClient> => {
  if (globalPg) return globalPg;
  const client = new PgClient({ connectionString });
  await client.connect();
  globalPg = client;
  return client;
};

/** ---------- Types ---------- */
export type OnMessageFn = (payload: { op: string; record?: any; id?: string }) => void;

export type ListenerOptions = {
  /** Ví dụ: 'post_changes' */
  channel: string;
  operations?: { insert?: boolean; update?: boolean; delete?: boolean };
  /** Tên bảng thực trong PG; có thể kèm schema. Mặc định dùng model name của Prisma */
  model?: string;
};

export type WithTriggerOptions = {
  connectionString: string;
  /** Map từ Prisma.ModelName -> cấu hình lắng nghe */
  models: Record<Prisma.ModelName, ListenerOptions>;
};

/** ---------- Extension factory ---------- */
export function withTrigger(opts: WithTriggerOptions) {
  // Bộ nhớ tạm cho mỗi kênh
  const listenersByChannel = new Map<string, Set<OnMessageFn>>();
  const channelHandler = new Map<string, (msg: PgNotification) => void>();
  const listenedChannels = new Set<string>();

  const ensureListenOnChannel = async (pg: PgClient, channel: string) => {
    if (listenedChannels.has(channel)) return;

    // Đăng ký handler riêng cho kênh này
    const handler = (msg: PgNotification) => {
      if (msg.channel !== channel) return;
      const set = listenersByChannel.get(channel);
      if (!set || set.size === 0 || !msg.payload) return;

      try {
        const payload = JSON.parse(msg.payload);
        for (const fn of set) fn(payload);
      } catch {
        // payload không phải JSON -> bỏ qua
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
        /**
         * Lắng nghe thay đổi cho một model của Prisma.
         * - Tạo/đặt lại trigger ở Postgres cho bảng tương ứng.
         * - LISTEN trên channel cấu hình.
         * - Trả về hàm hủy đăng ký.
         */
        async $listen(
          model: Prisma.ModelName,
          onMessage: OnMessageFn,
        ): Promise<() => Promise<void>> {
          const cfg = opts.models[model];
          if (!cfg) {
            throw new Error(
              `[notify-extension] Chưa cấu hình listener cho model "${String(model)}"`,
            );
          }

          const tableName = cfg.model ?? `"${String(model)}"`; // bảng mặc định = tên model, được quote
          const pg = await getPgClient(opts.connectionString);

          // Đảm bảo trigger tồn tại/được làm mới
          const triggerSQL = createPubTriggerSQL({
            channel: cfg.channel,
            op: cfg.operations,
            model: tableName,
          });
          await pg.query(triggerSQL);

          // Đảm bảo LISTEN đúng kênh
          await ensureListenOnChannel(pg, cfg.channel);

          // Đăng ký callback
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
            // Không drop trigger để tái sử dụng; nếu muốn có thể thêm tùy chọn cleanup
          };
        },
      },
    }),
  );
}
