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

      const response = await fetch(`/api/v2/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('📨 API tạo comment thành công:', data);

        // ⭐ Gọi callback cho ReplyModal hoặc CommentList
        onSuccess?.(data);

        // Gửi realtime
        socket.emit('new-comment', data);

        setContent('');
      } else {
        console.error('❌ API Error:', data);
      }
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

      <Button
        type="submit"
        disabled={loading || !currentUser}
        className="text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Sending..." : parentId ? "Send Reply" : "Send Comment"}
      </Button>
    </form>
  );
}
