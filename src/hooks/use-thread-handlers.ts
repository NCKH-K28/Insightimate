'use client';

import * as React from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import type { TCollabThread } from '@tiptap-pro/provider';
import type { User } from '@/contexts/user-context';

/**
 * Hook that provides thread and comment management functions for collaborative editing.
 *
 * Encapsulates all thread-related operations such as resolving/unresolving threads,
 * creating/editing/deleting comments, and handling comment reactions.
 *
 * @param editor - The Tiptap editor instance
 * @param activeThread - The ID of the currently active thread
 * @param user - The current user information
 * @param threads - Array of collaboration threads from the provider
 * @returns Object containing thread and comment management functions
 */
export const useThreadHandlers = (
  editor: Editor | null,
  activeThread: string | null,
  user: User | null,
  threads: TCollabThread[],
) => {
  /**
   * Resolves a thread by ID.
   */
  const handleResolve = React.useCallback(
    (id: string) => {
      if (!editor) return;
      editor.commands.resolveThread({ id });
    },
    [editor],
  );

  /**
   * Unresolves a previously resolved thread by ID.
   */
  const handleUnresolve = React.useCallback(
    (id: string) => {
      if (!editor) return;
      editor.commands.unresolveThread({ id });
    },
    [editor],
  );

  /**
   * Creates a new comment in the active thread.
   */
  const createComment = React.useCallback(
    (content: JSONContent) => {
      if (!editor || !activeThread || !user) return;

      editor.commands.createComment({
        content,
        threadId: activeThread,
        data: {
          authorId: user.id,
          authorName: user.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          reactions: {},
        },
      });
    },
    [editor, activeThread, user],
  );

  /**
   * Deletes a comment by ID and potentially removes the thread if empty.
   */
  const deleteComment = React.useCallback(
    (id: string) => {
      if (!editor || !activeThread) return;

      const currentThread = threads.find((t) => t.id === activeThread);
      if (!currentThread) return;

      editor.commands.removeComment({ id, threadId: activeThread });

      const remainingComments = currentThread.comments.filter((c) => c.id !== id);

      if (remainingComments.length === 0) {
        editor.commands.removeThread({ id: activeThread });
        return;
      }

      const allCommentsResolved = remainingComments.every((c) => c.data.resolvedAt);

      if (allCommentsResolved) {
        editor.commands.resolveThread({ id: activeThread });
      }
    },
    [activeThread, editor, threads],
  );

  /**
   * Adds or removes a user's reaction to a comment.
   */
  const handleCommentReaction = React.useCallback(
    (id: string, reactionEmoji: string) => {
      if (!editor || !activeThread || !user) return;

      const existingComment = threads
        .find((t) => t.id === activeThread)
        ?.comments.find((c) => c.id === id);

      if (!existingComment) return;

      const reactions = existingComment.data.reactions ? { ...existingComment.data.reactions } : {};
      const emojiReactions = reactions[reactionEmoji] ? [...reactions[reactionEmoji]] : [];

      if (emojiReactions.includes(user.id)) {
        reactions[reactionEmoji] = emojiReactions.filter((id) => id !== user.id);
      } else {
        reactions[reactionEmoji] = [...emojiReactions, user.id];
      }

      editor.commands.updateComment({
        id,
        threadId: activeThread,
        data: {
          ...existingComment.data,
          reactions,
        },
      });
    },
    [user, activeThread, threads, editor],
  );

  /**
   * Updates the content of an existing comment.
   */
  const editComment = React.useCallback(
    (id: string, newContent: JSONContent) => {
      if (!editor || !activeThread) return;

      const existingComment = threads
        .find((t) => t.id === activeThread)
        ?.comments.find((c) => c.id === id);

      if (!existingComment) return;

      editor.commands.updateComment({
        id,
        threadId: activeThread,
        content: newContent,
        data: {
          ...existingComment.data,
          editedAt: Date.now(),
        },
      });
    },
    [editor, threads, activeThread],
  );

  return {
    handleResolve,
    handleUnresolve,
    createComment,
    deleteComment,
    handleCommentReaction,
    editComment,
  };
};
