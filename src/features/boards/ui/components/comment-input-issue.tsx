'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import socket from '@/lib/socket-io';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface CommentInputProps {
  issueId: string;
  parentId?: string;
  onSuccess?: (newComment: any) => void;
}

export default function CommentInput({ issueId, parentId, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Lấy user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        const data = await res.json();
        setCurrentUser({ id: data.id, name: data.name });
      } catch (error) {
        console.error('❌ Lỗi lấy thông tin user:', error);
      }
    };
    fetchUser();
  }, []);

  // Gửi comment / reply
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !currentUser) return;

    setLoading(true);
    try {
      const bodyToSend: any = {
        content,
        userId: currentUser.id,
        userName: currentUser.name,
      };

      if (parentId) bodyToSend.parentId = parentId;

      // ⭐ NEW APPROACH: Chỉ gửi qua Socket, socket sẽ xử lý DB
      console.log('📤 Sending via Socket only:', { 
        isReply: !!parentId,
        body: bodyToSend 
      });

      // Gửi qua Socket với thông tin đầy đủ
      socket.emit('create-comment', {
        ...bodyToSend,
        issueId,
        tempId: Date.now().toString(), // Temporary ID cho optimistic UI
      });

      // Optimistic UI Update
      const tempComment = {
        ...bodyToSend,
        id: `temp-${Date.now()}`,
        issueId,
        createdAt: new Date().toISOString(),
      };

      console.log('✨ Optimistic UI update:', tempComment);
      onSuccess?.(tempComment);
      setContent('');

      // Lắng nghe response từ socket
      socket.once('comment-created', (data) => {
        console.log('📨 Comment được tạo qua socket:', data);
        // Update UI với real comment từ DB
        if (data.success) {
          onSuccess?.(data.comment);
        } else {
          console.error('❌ Socket Error:', data.error);
          // Rollback optimistic update nếu cần
        }
      });
    } catch (error) {
      console.error('❌ Lỗi khi gửi comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline'],
      [{ color: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean'],
    ],
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm"
    >
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        className="mb-4"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !currentUser}
          className="text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : parentId ? "Send Reply" : "Send Comment"}
        </Button>
      </div>
    </form>
  );
}
