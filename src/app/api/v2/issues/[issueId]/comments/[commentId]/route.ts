import { NextRequest } from 'next/server';
import { commentService } from '@/features/comments/server/comment.service';
import { createId } from '@paralleldrive/cuid2';

// GET: Lấy tất cả replies của comment này
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    
    console.log('🔍 GET replies request:', { commentId });
    
    const replies = await commentService.getReplies(commentId);
    
    console.log('✅ Found replies:', replies.length);
    return Response.json(replies);
  } catch (error: any) {
    console.error('❌ Error getting replies:', error.message);
    return new Response('Error getting replies', { status: 500 });
  }
}

// POST: Tạo reply cho comment này
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  try {
    const { content, userId, userName } = await req.json();
    const { commentId: parentId, issueId } = await params;
    
    console.log('💬 POST reply request:', { parentId, issueId, userId });
    
    if (!userId) {
      console.log('❌ No userId provided');
      return new Response('Unauthorized', { status: 401 });
    }

    // Kiểm tra parent comment có tồn tại không
    const parentComment = await commentService.getCommentById(parentId);
    if (!parentComment) {
      console.log('❌ Parent comment not found');
      return new Response('Parent comment not found', { status: 404 });
    }

    const reply = await commentService.createComment({
      content,
      userId,
      userName,
      issueId,
      parentId, // Reply sẽ có parentId = commentId
    });

    console.log('✅ Reply created successfully');
    return Response.json(reply);
  } catch (error: any) {
    console.error('❌ Error creating reply:', error.message);
    return new Response('Error creating reply', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  try {
    const { content } = await req.json();
    const { commentId } = await params;
    
    console.log('📝 PUT comment request:', { commentId, content: content?.substring(0, 50) });
    
    // Lấy userId từ header hoặc auth
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      console.log('❌ No userId in header for PUT');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('👤 User ID for PUT:', userId);

    const updatedComment = await commentService.updateComment(commentId, content, userId);
    return Response.json(updatedComment);
  } catch (error: any) {
    console.error('❌ Error updating comment:', error.message);
    
    if (error.message === 'Comment not found') {
      return new Response('Comment not found', { status: 404 });
    }
    if (error.message.includes('Permission denied')) {
      return new Response('Permission denied', { status: 403 });
    }
    
    return new Response('Error updating comment', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { commentId, issueId } = resolvedParams;
    
    console.log('🗑️ DELETE comment request:', { 
      commentId, 
      issueId, 
      url: req.url,
      method: req.method 
    });
    
    // Lấy userId từ header hoặc auth
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      console.log('❌ No userId in header');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('👤 User ID:', userId);
    
    await commentService.deleteComment(commentId, userId);
    console.log('✅ Comment deleted successfully');
    
    return Response.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting comment:', error.message);
    
    if (error.message === 'Comment not found') {
      return new Response('Comment not found', { status: 404 });
    }
    if (error.message.includes('Permission denied')) {
      return new Response('Permission denied', { status: 403 });
    }
    
    return new Response('Error deleting comment', { status: 500 });
  }
}