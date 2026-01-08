import { z } from 'zod';

const JsonRecord = z.record(z.string(), z.unknown());

export const DebeziumSourceSchema = z.object({
  version: z.string().optional(),
  connector: z.string().optional(),
  name: z.string().optional(),
  db: z.string().optional(),
  schema: z.string().optional(),
  table: z.string().optional(),

  ts_ms: z.number().optional(),
  snapshot: z.union([z.boolean(), z.string(), z.null()]).optional(),
  sequence: z.union([z.string(), z.null()]).optional(),
  txId: z.union([z.number(), z.null()]).optional(),
  lsn: z.union([z.number(), z.string(), z.null()]).optional(),
  xmin: z.union([z.number(), z.null()]).optional(),
});

export const ZDebeziumPgEventSchema = z
  .object({
    before: JsonRecord.nullable(),
    after: JsonRecord.nullable(),
    source: DebeziumSourceSchema.loose(),
    op: z.enum(['c', 'u', 'd', 'r']),
    ts_ms: z.number().optional(),
    transaction: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .loose();

export type DebeziumPgEvent = z.infer<typeof ZDebeziumPgEventSchema>;
