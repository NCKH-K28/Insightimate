'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Heart, Share2 } from 'lucide-react';
import ReplyModal from './reply-modal-issue';
import CommentInput from './comment-input-issue';
import socket from '@/lib/socket-io';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  issueId: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  issueId: string;
}

export default function CommentList({ issueId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch danh sách comments ban đầu
  // Fetch danh sách comments ban đầu
  useEffect(() => {
    const fetchComments = async () => {
      if (!issueId) return;

      try {
        setLoading(true);
        console.log('🔍 Đang fetch comments cho issue:', issueId);

        const response = await fetch(`/api/v2/issues/${issueId}/comments`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📜 Danh sách comments ban đầu:', data);
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [issueId]);

  // Xử lý socket events
  useEffect(() => {
    // Đăng ký các sự kiện socket
    const handleConnect = () => {
      console.log('🔌 Socket đã kết nối, ID:', socket.id);
    };

    const handleError = (error: Error) => {
      console.error('❌ Socket error:', error);
    };

    const handleDisconnect = (reason: string) => {
      console.log('🔌 Socket bị ngắt kết nối:', reason);
      if (reason === 'io server disconnect') {
        // Server đã ngắt kết nối, thử kết nối lại
        socket.connect();
      }
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleError);
    socket.on('disconnect', handleDisconnect);

    // Kết nối khi component mount
    if (!socket.connected) {
      socket.connect();
    }

    // Nhận comment từ server
    socket.on('receive-comment', (data: Comment) => {
      console.log('📨 Nhận comment mới từ socket:', data);

      // Kiểm tra xem comment đã tồn tại chưa
      setComments((prevComments) => {
        const commentExists = prevComments.some((comment) => comment.id === data.id);
        if (commentExists) {
          console.log('🔄 Comment đã tồn tại, không thêm lại');
          return prevComments;
        }

        console.log('➕ Thêm comment mới vào danh sách');
        return [data, ...prevComments];
      });
    });

    return () => {
      socket.off('receive-comment');
    };
  }, []);

  const handleNewComment = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
  };
  return (
    <div className='space-y-4 pb-30'>
      <CommentInput issueId={issueId} />

      {loading ? (
        <p className='text-center text-gray-500'>Đang tải...</p>
      ) : comments.length === 0 ? (
        <p className='text-center text-gray-400'>Chưa có bình luận nào.</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            className='bg-white shadow-md rounded-2xl p-4 border border-gray-100 mx-auto w-full'
          >
            <div className='flex items-center space-x-3 mb-2'>
              <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600'>
                {comment.userId.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className='text-sm font-semibold'>{comment.userName}</p>
                <p className='text-xs text-gray-400'>
                  {new Date(comment.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div
              className='prose max-w-none text-gray-800 mb-3'
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            <div className='flex items-center justify-between text-gray-400 text-sm'>
              <button className='flex items-center gap-1 hover:text-red-500 transition'>
                <Heart size={16} /> Like
              </button>
              <button className='flex items-center gap-1 hover:text-blue-500 transition'>
                <MessageCircle size={16} /> Reply
              </button>
              <Share2 size={16} className='hover:text-gray-700 cursor-pointer' />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
