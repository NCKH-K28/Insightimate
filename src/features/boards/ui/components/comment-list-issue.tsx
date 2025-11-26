'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Heart, Share2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import ReplyModal from './reply-modal-issue';
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

  // Edit Mode
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Current User
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // -------------------------------------
  // 1. FETCH COMMENTS BAN ĐẦU
  // -------------------------------------
  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

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
  // 1.1. LOAD REPLY COUNTS CHO CÁC COMMENTS
  // -------------------------------------
  useEffect(() => {
    const loadReplyCounts = async () => {
      const counts: Record<string, number> = {};
      
      // Load reply count cho từng comment
      for (const comment of comments) {
        const count = await getReplyCount(comment.id);
        counts[comment.id] = count;
      }
      
      setReplyCounts(counts);
    };

    if (comments.length > 0) {
      loadReplyCounts();
    }
  }, [comments, issueId]);

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
      console.log('📥 Loading replies for comment:', comment.id);
      
      // Sử dụng API mới: GET /comments/{commentId} để lấy replies
      const res = await fetch(
        `/api/v2/issues/${comment.issueId}/comments/${comment.id}`
      );
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Loaded replies:', data);
        setReplies(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ Failed to load replies:', res.status);
        setReplies([]);
      }
    } catch (err) {
      console.error('❌ Error loading replies:', err);
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
  // 5. XỬ LÝ EDIT COMMENT
  // -------------------------------------
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    try {
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUserId || ''
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: editContent } : c))
        );
        setEditingCommentId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // 5.1. XỬ LÝ TẠO REPLY
  // -------------------------------------
  const handleCreateReply = async (parentCommentId: string, content: string) => {
    if (!currentUserId) {
      console.error('❌ No current user ID');
      return;
    }
    
    try {
      console.log('💬 Creating reply for comment:', parentCommentId);
      
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${parentCommentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userId: currentUserId,
          userName: 'Current User' // TODO: Get from auth context
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        console.log('✅ Reply created:', newReply);
        
        // TODO: Update UI to show new reply or reload comments
        // Có thể reload toàn bộ comments hoặc append reply vào list
        
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create reply:', errorText);
      }
    } catch (error) {
      console.error('❌ Error creating reply:', error);
    }
  };

  // 5.2. LOAD REPLIES CHO COMMENT
  // -------------------------------------
  const loadReplies = async (commentId: string) => {
    try {
      console.log('📥 Loading replies for comment:', commentId);
      
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${commentId}`);
      if (response.ok) {
        const replies = await response.json();
        console.log('✅ Loaded replies:', replies.length);
        return replies;
      } else {
        console.error('❌ Failed to load replies');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading replies:', error);
      return [];
    }
  };

  // // 5.3. CLEAN HTML CONTENT
  // // -------------------------------------
  // const cleanHtmlContent = (htmlContent: string) => {
  //   if (!htmlContent) return '';
    
  //   let cleaned = htmlContent;
    
  //   // 1. Loại bỏ các thẻ p trống
  //   cleaned = cleaned
  //     .replace(/<p><\/p>/g, '') // Loại bỏ <p></p>
  //     .replace(/<p>\s*<\/p>/g, '') // Loại bỏ <p> </p> (có space)
  //     .replace(/<p><br\s*\/?><\/p>/g, '') // Loại bỏ <p><br></p> và <p><br/></p>
  //     .replace(/<p>&nbsp;<\/p>/g, '') // Loại bỏ <p>&nbsp;</p>
  //     .replace(/<p>(\s|&nbsp;)*<\/p>/g, ''); // Loại bỏ <p> với chỉ có whitespace/nbsp
    
  //   // 2. Nếu chỉ có 1 thẻ p với nội dung → chỉ lấy nội dung bên trong
  //   const singlePMatch = cleaned.match(/^<p>(.*?)<\/p>$/s);
  //   if (singlePMatch) {
  //     cleaned = singlePMatch[1];
  //   }
    
  //   // 3. Loại bỏ multiple <p> tags liên tiếp và thay bằng <br>
  //   cleaned = cleaned
  //     .replace(/<\/p>\s*<p>/g, '<br>') // Thay </p><p> bằng <br>
  //     .replace(/^<p>/, '') // Loại bỏ <p> ở đầu
  //     .replace(/<\/p>$/, ''); // Loại bỏ </p> ở cuối
    
  //   return cleaned.trim();
  // };

  // 5.4. ĐẾM SỐ LƯỢNG REPLY
  // -------------------------------------
  const getReplyCount = async (commentId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/v2/issues/${issueId}/comments/${commentId}`);
      if (response.ok) {
        const replies = await response.json();
        return Array.isArray(replies) ? replies.length : 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error getting reply count:', error);
      return 0;
    }
  };

  // 5.5. ĐẾM REPLY ĐỒNG BỘ (từ dữ liệu có sẵn)
  // -------------------------------------
  const getReplyCountSync = (commentId: string, repliesData: Comment[]): number => {
    return repliesData.filter(reply => reply.parentId === commentId).length;
  };

  // 5.6. CACHE REPLY COUNTS CHO PERFORMANCE
  // -------------------------------------
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});

  // -------------------------------------
  // 6. XỬ LÝ DELETE COMMENT
  // -------------------------------------
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa comment này?')) return;

    try {
      const deleteUrl = `/api/v2/issues/${issueId}/comments/${commentId}`;
      console.log('🗑️ DELETE request to:', deleteUrl);
      console.log('👤 Current User ID:', currentUserId);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId || ''
        },
      });

      console.log('📡 DELETE response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        console.log('✅ Comment deleted successfully');
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const errorText = await response.text();
        console.error('❌ DELETE failed:', errorText);
      }
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
    }
  };

  // -------------------------------------
  // 7. RENDER UI
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

            {editingCommentId === comment.id ? (
              <div className='mb-3'>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded-lg resize-none'
                  rows={3}
                />
                <div className='flex gap-2 mt-2'>
                  <button
                    onClick={() => handleSaveEdit(comment.id)}
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
                className='prose max-w-none text-gray-800 mb-3'
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            )}

            <div className='flex items-center justify-between text-gray-400 text-sm'>
              <div className='flex items-center gap-4'>
                <button className='flex items-center gap-1 hover:text-red-500 transition'>
                  <Heart size={16} /> Like
                </button>

                <button
                  className='flex items-center gap-1 hover:text-blue-500 transition'
                  onClick={() => handleOpenReply(comment)}
                >
                  <MessageCircle size={16} /> 
                  Reply
                  {replyCounts[comment.id] > 0 && (
                    <span className='bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium'>
                      {replyCounts[comment.id]}
                    </span>
                  )}
                </button>
              </div>

              <div className='flex items-center gap-2'>
                
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className='p-1 hover:bg-gray-100 rounded-full transition'>
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {/* Chỉ hiện nút edit/delete cho comment của current user */}
                    {currentUserId === comment.userId && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleEditComment(comment)}
                          className='cursor-pointer'
                        >
                          <Edit size={14} className='mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className='cursor-pointer text-red-600 hover:text-red-700'
                        >
                          <Trash2 size={14} className='mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
          
          // Cập nhật reply count cho parent comment
          if (selectedComment) {
            setReplyCounts(prev => ({
              ...prev,
              [selectedComment.id]: (prev[selectedComment.id] || 0) + 1
            }));
          }
        }}
        onReplyUpdated={(replyId, newContent) => {
          setReplies((prev) => 
            prev.map(r => r.id === replyId ? { ...r, content: newContent } : r)
          );
        }}
        onReplyDeleted={(replyId) => {
          setReplies((prev) => prev.filter(r => r.id !== replyId));
          
          // Giảm reply count cho parent comment
          if (selectedComment) {
            setReplyCounts(prev => ({
              ...prev,
              [selectedComment.id]: Math.max((prev[selectedComment.id] || 0) - 1, 0)
            }));
          }
        }}
      />
    </div>
  );
}
