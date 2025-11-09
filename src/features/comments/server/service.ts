import { prisma } from '@/lib/prisma';

export const commentService = {
  // 🟢 Tạo comment mới
  async create(data: {
    content: string;
    userId: string;
    userName?: string;
    issueId: string;
    parentId?: string;
  }) {
    const newComment = await prisma.comment.create({
      data: {
        content: data.content,
        userId: data.userId,
        userName: data.userName,
        issueId: data.issueId,
        parentId: data.parentId || null,
      },
    });
    return newComment;
  },

  // 🟢 Lấy tất cả comment theo issue
  async getByIssue(issueId: string) {
    const comments = await prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' },
    });
    return comments;
  },
};
