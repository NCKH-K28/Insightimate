'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

import socket from '@/lib/socket-io';
const socketClient = socket;

interface CommentInputProps {
  issueId: string;
  parentId?: string;
  onSuccess?: (newComment: any) => void;
}

export default function CommentInput({ issueId, parentId, onSuccess }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Debug socket connection
  useEffect(() => {
    socketClient.on('connect', () => {
      console.log('✅ Socket connected:', socketClient.id);
    });

    socketClient.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socketClient.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
    });

    return () => {
      socketClient.off('connect');
      socketClient.off('disconnect'); 
      socketClient.off('connect_error');
    };
  }, []);

  // const socketRef = useRef<Socket<any> | null>(null);

  // useEffect(() => {
  //   const socket = io({ path: '/api/socket' });

  //   socketRef.current = socket;

  //   socket.on('connect', () => {
  //     console.log('connected:', socket.id);
  //   });

  //   socket.on('server:message', (msg: string) => {
  //     console.log('Message from server:', msg);
  //   });

  //   return () => socket.disconnect();
  // }, []);

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
      const bodyToSend = {
        content,
        userId: currentUser.id,
        userName: currentUser.name,
        issueId,
        parentId: parentId || null,
        tempId: Date.now().toString(),
      };

      console.log('📤 Sending via Socket:', bodyToSend);

      // Gửi qua Socket với emit (không phải send!)
      socketClient.emit('create-comment', bodyToSend);

      // Chỉ clear form, chờ socket response
      setContent('');

      // Lắng nghe response từ socket - CHỈ GỌI 1 LẦN
      socketClient.once('comment-created', (data: any) => {
        console.log('📨 Comment được tạo qua socket:', data);
        // Update UI với real comment từ DB
        if (data.success) {
          onSuccess?.(data.comment);
        } else {
          console.error('❌ Socket Error:', data.error);
          // TODO: Hiện thông báo lỗi cho user
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
      className='mt-6 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm'
    >
      <ReactQuill
        theme='snow'
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
        className='mb-4'
      />

      <div className='flex justify-end'>
        <Button
          type='submit'
          disabled={loading || !currentUser}
          className='text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50'
        >
          {loading ? 'Sending...' : parentId ? 'Send Reply' : 'Send Comment'}
        </Button>
      </div>
    </form>
  );
}
