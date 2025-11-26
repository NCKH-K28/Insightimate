import { Server as IOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

const CommentEventSchema = z.object({
  content: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  issueId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  tempId: z.string().optional(),
});

export const config = { api: { bodyParser: false } };

export default function handler(_req: any, res: any) {
  if (!res.socket.server.io) {
    console.log('🚀 Starting new Socket.io server...');

    const io = new IOServer(res.socket.server, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('✅ client connected:', socket.id);

      socket.onAny((event, ...args) => {
        console.log('📩 event from client:', event, args);
      });

      socket.on('client:message', (msg) => {
        console.log('server nhận từ client:', msg);
        socket.emit('server:message', 'server đã nhận: ' + msg);
      });

      socket.on('create-comment', async (commentData) => {
        console.log('📝 Creating comment via socket:', commentData);

        try {
          // Validate dữ liệu
          const validData = CommentEventSchema.parse(commentData);

          // Tạo comment trong DB
          const newComment = await prisma.comment.create({
            data: {
              id: createId(),
              content: validData.content,
              userId: validData.userId,
              userName: validData.userName,
              issueId: validData.issueId,
              parentId: validData.parentId || null,
            },
          });

          console.log('✅ Comment created:', newComment.id);

          // Gửi lại cho chính client đã gửi (kèm tempId để replace)
          socket.emit('comment-created', {
            success: true,
            tempId: validData.tempId,
            comment: newComment,
          });

          // Gửi cho các client khác
          socket.broadcast.emit('receive-comment', newComment);
        } catch (error) {
          console.error('❌ Error creating comment via socket:', error);
          socket.emit('comment-created', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle reply deletion broadcast
      socket.on('reply-deleted-broadcast', (data) => {
        console.log('🗑️ Broadcasting reply deletion:', data);
        
        // Broadcast tới tất cả client khác (không gửi lại cho client gửi)
        socket.broadcast.emit('reply-deleted', {
          replyId: data.replyId,
          parentId: data.parentId,
          issueId: data.issueId
        });
      });
    });
  } else {
    console.log('♻️ Socket.io server already running');
  }
  res.end();
}
