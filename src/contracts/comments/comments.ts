import { z } from 'zod';

export const ZCommentCreateInput = z.object({
  content: z.string().min(1, 'Nội dung không được để trống'),
  issueId: z.string(),
  parentId: z.string().nullable().optional(),
});

export const ZComment = z.object({
  id: z.string(),
  content: z.string(),
  userId: z.string(),
  userName: z.string().nullable().optional(),
  issueId: z.string(),
  parentId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Comment = z.infer<typeof ZComment>;
export type CommentCreateInput = z.infer<typeof ZCommentCreateInput>;
