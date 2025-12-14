'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentThread, CommentThreadSkeleton } from '@/features/collab/ui/comment-thread';
import axiosInstance from '@/lib/api/_client';
import { io, Socket } from 'socket.io-client';
import sortBy from 'lodash/sortBy';
import { useQuery } from '@tanstack/react-query';
import { CommentItem, CommentList } from '@/contracts/collab/collab';

type CommentsTabProps = { issueId: string };

const CommentsTab: React.FC<CommentsTabProps> = ({ issueId }) => {
  const [comments, setComments] = useState<CommentItem[]>();
  const socketRef = useRef<Socket | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const path = `/comments?targetType=ISSUE&targetId=${issueId}`;
      const res = await axiosInstance.get<CommentList>(path);
      return res.data;
    },
  });

  const threadId = data?.meta.threadId;

  useEffect(() => {
    if (!threadId) return;

    const socket = io({ path: '/api/socketio' });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('thread:join', threadId));
    socket.on('comment:new', (newComment: CommentItem) => {
      setComments((prev) =>
        sortBy([...(prev ?? data?.data ?? []), newComment], ['createdAt', 'id']).reverse(),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [threadId, data?.data]);

  const sendComment = useCallback(
    async (content: string) => {
      await axiosInstance.post('/comments', { threadId, content });
    },
    [threadId],
  );

  if (isPending) return <CommentThreadSkeleton />;

  return (
    <CommentThread
      comments={comments ?? data?.data ?? []}
      onSend={sendComment}
      isLoading={isPending}
    />
  );
};

export default function IssueActivity({ issueId }: { issueId: string }) {
  return (
    <Tabs defaultValue='comments' className='w-full'>
      <TabsList>
        <TabsTrigger value='comments'>Comments</TabsTrigger>
      </TabsList>
      <TabsContent value='comments'>
        <CommentsTab issueId={issueId} />
      </TabsContent>
    </Tabs>
  );
}
