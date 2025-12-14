'use client';

import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import EditableRichText from '@/features/boards/ui/components/editable-rich-text';
import { CommentItem } from '@/contracts/collab/collab';
import { SingleComment } from './single-comment';

type Comment = CommentItem & { replies?: Comment[]; likes?: number; isLiked?: boolean };

interface CommentThreadProps {
  comments: Comment[];
  totalCount?: number;
  onSend?: (content: string) => void;
  onReply?: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export function CommentThread({
  comments,
  totalCount,
  onSend,
  onReply,
  onLike,
  onEdit,
  onDelete,
  className,
  isLoading,
}: CommentThreadProps) {
  const [, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (value: string) => {
      const content = value.trim();
      if (!content || !onSend) return;
      setIsSubmitting(true);
      try {
        await onSend(content);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSend],
  );

  const count = totalCount ?? comments.length;
  const isEmpty = !comments.length && !isLoading;

  return (
    <Card className={cn('w-full border-0 p-0 shadow-sm gap-2', className)}>
      <CardHeader className='p-4 space-y-4'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <MessageCircle className='size-4' />
          Comments
          {count > 0 && (
            <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              {count}
            </span>
          )}
        </CardTitle>

        <div className='flex gap-3'>
          <Avatar className='size-8 shrink-0'>
            <AvatarFallback className='bg-primary text-xs text-primary-foreground'>
              You
            </AvatarFallback>
          </Avatar>
          <EditableRichText
            placeholder='Write a comment.. .'
            value=''
            onSave={handleSubmit}
            minHeight='80px'
            maxHeight='200px'
            className='w-full rounded-md border border-muted bg-muted/30 text-sm'
          />
        </div>
      </CardHeader>

      {comments.length > 0 && <Separator />}

      <CardContent className='p-0'>
        <ScrollArea className='p-4 max-h-96 overflow-auto'>
          <div className='flex flex-col gap-4'>
            {isEmpty ? (
              <div className='flex flex-col items-center py-8 text-center'>
                <MessageCircle className='mb-3 size-12 text-muted-foreground/30' />
                <p className='text-sm text-muted-foreground'>No comments yet</p>
                <p className='text-xs text-muted-foreground/70'>Be the first to share! </p>
              </div>
            ) : (
              comments.map((comment) => (
                <SingleComment
                  key={comment.id}
                  comment={comment}
                  onReply={onReply}
                  onLike={onLike}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
          <ScrollBar orientation='vertical' />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const CommentThreadSkeleton = () => (
  <Card className='grid size-full grid-rows-[auto_1fr] border-0 shadow-sm'>
    <CardHeader className='pb-3'>
      <Skeleton className='h-5 w-32' />
    </CardHeader>
    <CardContent className='space-y-4 pt-0'>
      <div className='flex gap-3'>
        <Skeleton className='size-8 rounded-full' />
        <Skeleton className='h-20 flex-1 rounded-xl' />
      </div>
      <Separator />
      {[1, 2, 3].map((i) => (
        <div key={i} className='flex gap-3'>
          <Skeleton className='size-8 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-16 w-full rounded-xl' />
            <div className='flex gap-2'>
              <Skeleton className='h-6 w-14 rounded-full' />
              <Skeleton className='h-6 w-14 rounded-full' />
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
