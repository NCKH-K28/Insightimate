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
  parentId?: string | null;
}

interface CommentListProps {
  issueId: string;
}

export default function CommentList({ issueId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Reply
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replies, setReplies] = useState<Comment[]>([]);

  // -------------------------------------
  // 1. FETCH COMMENTS BAN ĐẦU
  // -------------------------------------
  useEffect(() => {
    if (!issueId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetch comments cho issue:', issueId);

        const response = await fetch(`/api/v2/issues/${issueId}/comments`);
        if (!response.ok) throw new Error('Không load được comments');

        const data = await response.json();

        const rootComments = Array.isArray(data)
          ? data.filter((c) => c.parentId === null)
          : [];

        console.log('📜 Comments ban đầu:', rootComments);

        setComments(rootComments);
      } catch (err) {
        console.error('❌ Lỗi load comments:', err);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [issueId]);

  // -------------------------------------
  // 2. SOCKET IO — NHẬN COMMENT MỚI
  // -------------------------------------
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleReceiveComment = (data: Comment) => {
      console.log('📨 Nhận comment mới từ socket:', data);

      // Nếu là reply → không thêm vào comments gốc
      if (data.parentId) {
        console.log('↩️ Đây là reply → bỏ qua ở CommentList');
        return;
      }

      // Nếu là root comment thì thêm vào danh sách
      setComments((prev) => {
        if (prev.some((c) => c.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    socket.on('receive-comment', handleReceiveComment);

    return () => {
      socket.off('receive-comment', handleReceiveComment);
    };
  }, []);

  // -------------------------------------
  // 3. MỞ MODAL REPLY
  // -------------------------------------
  const handleOpenReply = async (comment: Comment) => {
    setSelectedComment(comment);
    setIsReplyModalOpen(true);

    try {
      const res = await fetch(
        `/api/v2/issues/${comment.issueId}/comments/${comment.id}/replies`
      );
      const data = await res.json();
      setReplies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi load replies:', err);
      setReplies([]);
    }
  };

  // -------------------------------------
  // 4. CALLBACK KHI TẠO COMMENT CHA
  // -------------------------------------
  const handleNewComment = (newComment: Comment) => {
    if (newComment.parentId) return; // reply thì không thêm

    setComments((prev) => [newComment, ...prev]);
  };

  // -------------------------------------
  // 5. RENDER UI
  // -------------------------------------
  return (
    <div className='space-y-4 pb-30'>
      {/* Form comment cha */}
      <CommentInput issueId={issueId} onSuccess={handleNewComment} />

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
                {comment.userName.slice(0, 1).toUpperCase()}
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

              <button
                className='flex items-center gap-1 hover:text-blue-500 transition'
                onClick={() => handleOpenReply(comment)}
              >
                <MessageCircle size={16} /> Reply
              </button>

              <Share2 size={16} className='hover:text-gray-700 cursor-pointer' />
            </div>
          </div>
        ))
      )}

      {/* Modal trả lời */}
      <ReplyModal
  isOpen={isReplyModalOpen}
  onClose={() => setIsReplyModalOpen(false)}
  parentComment={selectedComment}
  replies={replies}
  onReplyAdded={(newReply) => {
    setReplies((prev) => [...prev, newReply]); // ⭐ cập nhật ngay UI modal
  }}
/>
    </div>
  );
}
