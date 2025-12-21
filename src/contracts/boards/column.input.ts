import { z } from 'zod';
const ZHexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color');
const ZStatusCategory = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

const ZStatusCreate = z
  .object({
    name: z.string().trim().min(1),
    color: ZHexColor.optional(),
    iconURL: z.string().url().optional(),
    category: ZStatusCategory,
  })
  .strict();

export const ZStatusUpdate = z
  .object({
    name: z.string().trim().min(1).optional(),
    color: z.union([ZHexColor, z.null()]).optional(), // allow clear
    iconURL: z.union([z.string().url(), z.null()]).optional(), // allow clear
    category: ZStatusCategory.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Update must include at least one field');

const ZStatusIdPath = z.string().regex(/^\/statuses\/[A-Za-z0-9_-]+$/, 'Invalid status id path');

const ZNamePatch = z.object({
  op: z.enum(['add', 'replace']),
  path: z.literal('/name'),
  value: z.string().trim().min(1),
});

const ZStatusRemovePatch = z.object({
  op: z.literal('remove'),
  path: ZStatusIdPath,
});

const ZStatusAddPatch = z.object({
  op: z.literal('add'),
  path: z.literal('/statuses'),
  value: ZStatusCreate,
});

const ZPatch = z.union([ZNamePatch, ZStatusAddPatch, ZStatusRemovePatch]);
export const ZSafeColumnPatch = z.array(ZPatch).min(1);
export const ZColumnUpdatePatchInput = z.object({ patches: ZSafeColumnPatch });
export type ColumnUpdatePatchInput = z.infer<typeof ZColumnUpdatePatchInput>;
