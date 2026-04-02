import { z } from 'zod';
import { isoString } from '../_shared';

// ===== Label Schemas =====

export const ZLabel = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  createdAt: isoString,
  updatedAt: isoString,
});

export type Label = z.infer<typeof ZLabel>;

export const ZLabelList = z.object({
  data: z.array(ZLabel),
  meta: z.object({ total: z.number() }),
});

export const ZLabelCreateInput = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color (e.g. #ff0000)')
    .optional(),
});

export type LabelCreateInput = z.infer<typeof ZLabelCreateInput>;

export const ZLabelUpdateInput = ZLabelCreateInput.partial();

export type LabelUpdateInput = z.infer<typeof ZLabelUpdateInput>;

// ===== Issue-Label Attachment =====

export const ZIssueLabelAttachInput = z.object({
  labelId: z.string().min(1, 'Label ID is required'),
});

export type IssueLabelAttachInput = z.infer<typeof ZIssueLabelAttachInput>;

export const ZIssueLabel = z.object({
  id: z.string(),
  issueId: z.string(),
  labelId: z.string(),
  createdAt: isoString,
  label: ZLabel.optional(),
});

export type IssueLabel = z.infer<typeof ZIssueLabel>;
