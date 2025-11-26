'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import CommentInput from './comment-input-issue';
import socket from '@/lib/socket-io';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  issueId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
}

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentComment: Comment | null;
  replies: Comment[];
  onReplyAdded: (newReply: Comment) => void;
  onReplyUpdated?: (replyId: string, newContent: string) => void;
  onReplyDeleted?: (replyId: string) => void;
}

export default function ReplyModal({
  isOpen,
  onClose,
  parentComment,
  replies,
  onReplyAdded,
  onReplyUpdated,
  onReplyDeleted,
}: ReplyModalProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Lấy current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/v2/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Socket listener cho real-time reply updates
  useEffect(() => {
    if (!isOpen || !parentComment) return;

    // Lắng nghe reply mới từ các client khác
    const handleReceiveComment = (data: Comment) => {
      console.log('📨 Reply Modal nhận comment:', data);
      
      // Chỉ quan tâm reply cho parent comment hiện tại
      if (data.parentId === parentComment.id) {
        onReplyAdded(data);
      }
    };

    // Lắng nghe reply bị xóa từ các client khác
    const handleReplyDeleted = (data: { replyId: string; parentId: string }) => {
      console.log('🗑️ Reply Modal nhận reply deleted:', data);
      
      // Chỉ quan tâm reply của parent comment hiện tại
      if (data.parentId === parentComment.id) {
        onReplyDeleted?.(data.replyId);
      }
    };

    socket.on('receive-comment', handleReceiveComment);
    socket.on('reply-deleted', handleReplyDeleted);

    return () => {
      socket.off('receive-comment', handleReceiveComment);
      socket.off('reply-deleted', handleReplyDeleted);
    };
  }, [isOpen, parentComment, onReplyAdded, onReplyDeleted]);

  if (!isOpen || !parentComment) return null;

  const issueId = parentComment.issueId;

  // Helper function để clean HTML content
  const cleanHtmlContent = (htmlContent: string) => {
    if (!htmlContent) return '';
    
    // Loại bỏ các thẻ p trống
    const cleaned = htmlContent
      .replace(/<p><\/p>/g, '') // Loại bỏ <p></p>
      .replace(/<p>\s*<\/p>/g, '') // Loại bỏ <p> </p> (có space)
      .replace(/<p><br><\/p>/g, '') // Loại bỏ <p><br></p>
      .replace(/<p>&nbsp;<\/p>/g, '') // Loại bỏ <p>&nbsp;</p>
      .trim();
    
    return cleaned;
  };

  // Handler functions
  const handleEditReply = (reply: Comment) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content);
  };

  const handleSaveEdit = async (replyId: string) => {
    try {
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId || ''
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        onReplyUpdated?.(replyId, editContent);
        setEditingReplyId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReplyId(null);
    setEditContent('');
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa reply này?')) return;

    try {
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${replyId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId || ''
        },
      });

      if (response.ok) {
        // Broadcast real-time reply deletion tới các client khác
        socket.emit('reply-deleted-broadcast', {
          replyId: replyId,
          parentId: parentComment?.id,
          issueId: issueId
        });
        
        onReplyDeleted?.(replyId);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50'>
      <div className='bg-white rounded-2xl w-[500px] max-h-[80vh] overflow-y-auto shadow-xl p-4'>

        {/* Bình luận gốc */}
        <div className='border rounded-xl p-4 mb-3 bg-gray-50'>
          <div className='flex items-center mb-1'>
            <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 mr-2'>
              {parentComment.userName.slice(0, 1)}
            </div>
            <p className='font-semibold text-sm'>{parentComment.userName}</p>
          </div>

          <div
            className='text-gray-800 text-sm'
            dangerouslySetInnerHTML={{ __html: cleanHtmlContent(parentComment.content) }}
          />

          <p className='text-xs text-gray-400 mt-1'>
            {new Date(parentComment.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>

        {/* Danh sách reply */}
        <div className='space-y-2 mb-4'>
          {replies
            .filter((r) => r.parentId === parentComment.id)
            .map((r) => (
              <div key={r.id} className='border rounded-xl p-3 bg-gray-50 ml-8'>
                <div className='flex items-center mb-1'>
                  <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-600 mr-2'>
                    {r.userName.slice(0, 1)}
                  </div>
                  <p className='font-semibold text-sm'>{r.userName}</p>
                </div>

                {editingReplyId === r.id ? (
                  <div className='space-y-2'>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className='w-full p-2 border rounded-lg text-sm'
                      rows={3}
                    />
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleSaveEdit(r.id)}
                        className='px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600'
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className='px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className='text-gray-700 text-sm'
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(r.content) }}
                  />
                )}

                <div className='flex items-center justify-between mt-2'>
                  <p className='text-xs text-gray-400'>
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </p>

                  {currentUserId === r.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className='p-1 hover:bg-gray-100 rounded-full transition'>
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => handleEditReply(r)}
                          className='cursor-pointer'
                        >
                          <Edit size={14} className='mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteReply(r.id)}
                          className='cursor-pointer text-red-600 hover:text-red-700'
                        >
                          <Trash2 size={14} className='mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Ô nhập reply */}
        <CommentInput
          issueId={issueId}
          parentId={parentComment.id}
          onSuccess={(newReply) => onReplyAdded(newReply)}  // ⭐ update UI ngay lập tức
        />

        {/* Nút đóng */}
        <div className='flex justify-end gap-2 mt-3'>
          <button
            className='px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300'
            onClick={onClose}
          >
            Close 
          </button>
        </div>
      </div>
    </div>
  );
}
