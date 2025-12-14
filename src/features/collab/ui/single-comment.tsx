'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MoreHorizontal, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import EditableRichText from '@/features/boards/ui/components/editable-rich-text';
import { CommentItem } from '@/contracts/collab/collab';
import { formatDistanceToNow } from 'date-fns';

type Comment = CommentItem & { replies?: Comment[]; likes?: number; isLiked?: boolean };

interface CommentProps {
  comment: Comment;
  depth?: number;
  onReply?: (parentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
}

export function SingleComment({
  comment,
  depth = 0,
  onReply,
  onLike,
  onEdit,
  onDelete,
}: CommentProps) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyContent, setReplyContent] = React.useState('');
  const [showReplies, setShowReplies] = React.useState(true);

  const replyCount = comment.replies?.length || 0;
  const actualDepth = Math.min(depth, 3);

  return (
    <div
      className={cn('group flex gap-2', actualDepth > 0 && 'ml-6 mt-2 border-l border-muted pl-3')}
    >
      <Avatar className='h-7 w-7 shrink-0'>
        <AvatarImage src={comment.author.avatar ?? undefined} alt={comment.author.name} />
        <AvatarFallback className='bg-muted text-xs'>
          {comment.author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className='flex-1 min-w-0'>
        <div className='rounded-lg bg-muted/40 px-3 py-2'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2 text-xs'>
              <span className='font-medium truncate'>{comment.author.name}</span>
              <span className='text-muted-foreground'>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 opacity-0 group-hover:opacity-100'
                >
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit?.(comment.id, comment.content)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => onDelete?.(comment.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className='mt-1 text-sm' dangerouslySetInnerHTML={{ __html: comment.content }} />
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1 mt-1'>
          <Button
            variant='ghost'
            size='sm'
            className={cn('h-6 px-2 text-xs', comment.isLiked && 'text-primary')}
            onClick={() => onLike?.(comment.id)}
          >
            <ThumbsUp className={cn('h-3 w-3 mr-1', comment.isLiked && 'fill-current')} />
            {comment.likes || null}
          </Button>

          <Toggle
            size='sm'
            className='h-6 px-2 text-xs'
            pressed={isReplying}
            onPressedChange={setIsReplying}
          >
            <Reply className='h-3 w-3 mr-1' />
            Reply
          </Toggle>

          {replyCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <ChevronUp className='h-3 w-3 mr-1' />
              ) : (
                <ChevronDown className='h-3 w-3 mr-1' />
              )}
              {replyCount}
            </Button>
          )}
        </div>

        {/* Reply Input */}
        {isReplying && (
          <EditableRichText
            placeholder={`Reply to ${comment.author.name}...`}
            value={replyContent}
            onSave={setReplyContent}
            minHeight='80px'
            maxHeight='200px'
            className='mt-2 rounded-md border border-muted bg-muted/30 text-sm'
          />
        )}

        {/* Replies */}
        {showReplies &&
          comment.replies?.map((reply) => (
            <SingleComment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    </div>
  );
}
