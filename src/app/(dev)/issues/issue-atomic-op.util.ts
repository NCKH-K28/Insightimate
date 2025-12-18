import { z } from 'zod';

const ZMeta = z.record(z.string(), z.unknown());

const ZIssueType = z.literal('issues');
const ZId = z.string().min(1);

const ZExistingIssueId = z
  .object({
    type: ZIssueType,
    id: ZId,
  })
  .strict();

const ZNewIssueLid = z
  .object({
    type: ZIssueType,
    lid: ZId,
  })
  .strict();

const ZIssueIdentifier = z.union([ZExistingIssueId, ZNewIssueLid]);

const ZIssueRef = z
  .object({
    type: ZIssueType,
    id: ZId.optional(),
    lid: ZId.optional(),
    relationship: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!v.id && !v.lid) {
      ctx.addIssue({ code: 'custom', message: "ref must include either 'id' or 'lid'", path: [] });
    }
  });

const ZIssueAttrs = z
  .object({
    summary: z.string().min(1).optional(),
    description: z.string().optional(),
    statusId: z.string().min(1).optional(),
    priorityId: z.string().min(1).optional(),
    assigneeId: z.string().min(1).optional(),
  })
  .strict();

const ZIssueRelationships = z
  .object({
    parent: z
      .object({
        data: ZExistingIssueId, // parent phải là existing id
      })
      .strict(),
  })
  .strict();

const ZAddIssueData = z
  .object({
    type: ZIssueType,
    lid: ZId,
    attributes: ZIssueAttrs.optional(),
    relationships: ZIssueRelationships, // create sub-issue => require parent
  })
  .strict();

const ZUpdateIssueData = z
  .object({
    type: ZIssueType,
    id: ZId,
    attributes: ZIssueAttrs,
  })
  .strict()
  .superRefine((v, ctx) => {
    if (!v.attributes || Object.keys(v.attributes).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'update.data.attributes must include at least one field',
        path: ['attributes'],
      });
    }
  });

const OpEnum = z.enum(['add', 'update', 'remove']);

const ZBaseOp = z
  .object({
    op: OpEnum,
    ref: ZIssueRef.optional(),
    data: z.unknown().optional(),
    meta: ZMeta.optional(),
  })
  .strict();

const ZAddOp = ZBaseOp.extend({
  op: z.literal('add'),
  data: ZAddIssueData,
}).superRefine((v, ctx) => {
  if (v.ref) ctx.addIssue({ code: 'custom', message: 'add must not include ref', path: ['ref'] });
});

const ZUpdateOp = ZBaseOp.extend({
  op: z.literal('update'),
  data: ZUpdateIssueData,
}).superRefine((v, ctx) => {
  if (v.ref)
    ctx.addIssue({
      code: 'custom',
      message: 'update must not include ref (use data.id)',
      path: ['ref'],
    });
});

const ZRemoveOp = ZBaseOp.extend({
  op: z.literal('remove'),
  ref: z.object({ type: ZIssueType, id: ZId }).strict(),
}).superRefine((v, ctx) => {
  if (v.data !== undefined)
    ctx.addIssue({ code: 'custom', message: 'remove must not include data', path: ['data'] });
});

export const ZAtomicOp = z.union([ZAddOp, ZUpdateOp, ZRemoveOp]);
export const ZAtomicRequest = z
  .object({
    'atomic:operations': z.array(ZAtomicOp).min(1),
    meta: ZMeta.optional(),
    links: ZMeta.optional(),
    jsonapi: ZMeta.optional(),
  })
  .strict();
