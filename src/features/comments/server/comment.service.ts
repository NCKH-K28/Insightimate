import { prisma } from '@/lib/prisma';

export const commentService = {
  // Lấy tất cả comments của issue
  async getCommentsByIssue(issueId: string) {
    return await prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Lấy comment theo ID
  async getCommentById(commentId: string) {
    return await prisma.comment.findUnique({
      where: { id: commentId },
    });
  },

  // Tạo comment mới
  async createComment(data: {
    content: string;
    userId: string;
    userName: string;
    issueId: string;
    parentId?: string | null;
  }) {
    return await prisma.comment.create({
      data: {
        ...data,
        parentId: data.parentId || null,
      },
    });
  },

  // Sửa comment
  async updateComment(commentId: string, content: string, userId: string) {
    // Kiểm tra comment có tồn tại và user có quyền sửa không
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Chỉ cho phép user tạo comment mới được sửa
    if (comment.userId !== userId) {
      throw new Error('Permission denied: You can only edit your own comments');
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
      },
    });
  },

  // Xóa comment
  async deleteComment(commentId: string, userId: string) {
    console.log('🗑️ deleteComment service called:', { commentId, userId });
    
    // Kiểm tra comment có tồn tại và user có quyền xóa không
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    console.log('🔍 Found comment for deletion:', comment ? { 
      id: comment.id, 
      userId: comment.userId,
      content: comment.content.substring(0, 50) + '...'
    } : 'Not found');

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Chỉ cho phép user tạo comment mới được xóa
    if (comment.userId !== userId) {
      console.log('❌ Permission denied for deletion:', { 
        commentUserId: comment.userId, 
        requestUserId: userId 
      });
      throw new Error('Permission denied: You can only delete your own comments');
    }

    // Xóa comment và tất cả replies (cascade delete)
    const result = await prisma.comment.delete({
      where: { id: commentId },
    });
    
    console.log('✅ Comment deleted successfully from database');
    return result;
  },

  // Lấy replies của comment
  async getReplies(parentId: string) {
    return await prisma.comment.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });
  },
};