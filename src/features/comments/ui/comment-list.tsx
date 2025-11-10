 

'use client';

import { useEffect, useState } from 'react';
import socket from '@/lib/socket-io';

interface Comment {
  id?: string;
  content: string;
  userId: string;
  userName?: string;
  issueId: string;
  parentId?: string | null;
  createdAt?: string;
}

export default function CommentList({ issueId, userId, userName }: any) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Lắng nghe comment mới
    socket.on('comment_added', (comment: Comment) => {
      setComments((prev) => [...prev, comment]);
    });

    return () => {
      socket.off('comment_added');
    };
  }, []);

  const handleSend = () => {
    if (!newComment.trim()) return;
    socket.emit('create_comment', {
      content: newComment,
      userId,
      userName,
      issueId,
    });
    setNewComment('');
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        {comments.map((c, i) => (
          <div key={i} className='p-2 border rounded-lg'>
            <strong>{c.userName ?? 'Người dùng'}:</strong> {c.content}
          </div>
        ))}
      </div>

      <div className='flex space-x-2'>
        <input
          type='text'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Nhập bình luận...'
          className='border p-2 flex-1 rounded-lg'
        />
        <button onClick={handleSend} className='bg-blue-600 text-white px-4 py-2 rounded-lg'>
          Gửi
        </button>
      </div>
    </div>
  );
}
