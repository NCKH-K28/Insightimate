import { z } from 'zod';

const ZCommentTargetType = z.enum(['ISSUE']);
export const ZCommentThread = z.object({
  id: z.string(),
  targetType: ZCommentTargetType,
  targetId: z.string(),
});

export const ZComment = z.object({
  id: z.string(),
  threadId: z.string(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.coerce.string(),
});

export type CommentTargetType = z.infer<typeof ZCommentTargetType>;
export type CommentThread = z.infer<typeof ZCommentThread>;
export type Comment = z.infer<typeof ZComment>;

// .input

export const ZCommentSendInput = z.object({
  threadId: z.string(),
  content: z.string().min(1).max(5000),
});

// .query
const ZAuthor = z.object({ id: z.string(), name: z.string(), avatar: z.string().nullable() });

export const ZByThreadIdInput = z.object({ threadId: z.string() });
export const ZByTagetInput = z.object({ targetId: z.string(), targetType: z.enum(['ISSUE']) });

export const ZCommentListQuery = z.union([ZByThreadIdInput, ZByTagetInput]);
export const ZCommentItem = ZComment.extend({ author: ZAuthor });
export const ZCommentList = z.object({
  data: z.array(ZCommentItem),
  meta: z.object({ threadId: z.string() }),
});

export type CommentListQuery = z.infer<typeof ZCommentListQuery>;
export type CommentSendInput = z.infer<typeof ZCommentSendInput>;
export type CommentItem = z.infer<typeof ZCommentItem>;
export type CommentList = z.infer<typeof ZCommentList>;
