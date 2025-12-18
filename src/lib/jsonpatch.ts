// JSON Patch - RFC 6902
// JSON Merge Patch - RFC 7396
// JSON Pointers - RFC 6901
import { z } from 'zod';

// ==== Response Schemas ====
const ZOpBase = z.object({ path: z.string() });
const ZOpAdd = ZOpBase.extend({ op: z.literal('add'), value: z.any() });
const ZOpRemove = ZOpBase.extend({ op: z.literal('remove') });
const ZOpReplace = ZOpBase.extend({ op: z.literal('replace'), value: z.any() });
// const ZOpMove = ZOpBase.extend({ op: z.literal("move"), from: z.string() });
// const ZOpCopy = ZOpBase.extend({ op: z.literal("copy"), from: z.string() });
// const ZOpTest = ZOpBase.extend({ op: z.literal("test"), value: z.any() });

export const ZJsonPatchOp = z.union([
  ZOpAdd,
  ZOpRemove,
  ZOpReplace,
  // ZOpMove,
  // ZOpCopy,
  // ZOpTest,
]);

export type JsonPatchOp = z.infer<typeof ZJsonPatchOp>;

export const ZJsonPatchBasic = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  value: z.any().optional(),
  from: z.string().optional(),
});

export type JsonPatchBasic = z.infer<typeof ZJsonPatchBasic>;
