'use client';

import * as React from 'react';
import type { TCollabComment } from '@tiptap-pro/provider';
import type { Editor } from '@tiptap/react';

// --- Contexts ---
import { useCollab } from '@/contexts/collab-context';
import { useThreadActions, useThreadIds, useThreadState } from '@/contexts/thread-store';
import { useUser } from '@/contexts/user-context';
import { useAppState } from '@/contexts/app-context';

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile';
import { useThreadHandlers } from '@/hooks/use-thread-handlers';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Tiptap UI ---
import { Comment } from '@/components/tiptap-ui/comment';
import { ThreadFooter } from '@/components/tiptap-ui/thread/thread-footer';
import { ThreadHeader } from '@/components/tiptap-ui/thread/thread-header';

// --- Styles ---
import '@/components/tiptap-ui/thread/thread.scss';

export interface ThreadProps {
  editor?: Editor | null;
}

export const Thread = ({ editor: providedEditor }: ThreadProps) => {
  const { editor } = useTiptapEditor(providedEditor);
  const { user } = useUser();
  const { threads } = useThreadState();
  const threadIds = useThreadIds();
  const { activeThread, setActiveThread } = useAppState();
  const { nextThread, prevThread } = useThreadActions();
  const isMobile = useIsMobile();
  const [isCommenting, setIsCommenting] = React.useState(false);
  const { provider } = useCollab();

  const {
    handleResolve,
    handleUnresolve,
    createComment,
    deleteComment,
    handleCommentReaction,
    editComment,
  } = useThreadHandlers(editor, activeThread, user, threads);

  const thread = threads.find((thread) => thread.id === activeThread);
  const threadCount = threadIds?.length || 0;
  const currentThreadIndex = thread ? threadIds?.indexOf(thread.id) || 0 : 0;

  const closeThread = React.useCallback(() => {
    setActiveThread(null);
  }, [setActiveThread]);

  const deleteThread = React.useCallback(() => {
    if (!editor || !activeThread) return;
    editor.commands.removeThread({ id: activeThread });
    closeThread();
  }, [editor, closeThread, activeThread]);

  const handleResolveUnresolve = React.useCallback(() => {
    if (!thread) return;
    if (thread.resolvedAt) {
      handleUnresolve(thread.id);
    } else {
      handleResolve(thread.id);
    }
  }, [handleResolve, handleUnresolve, thread]);

  const copyThreadLink = React.useCallback(() => {
    if (!thread) return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('thread_id', thread.id);
    navigator.clipboard.writeText(currentUrl.toString());
  }, [thread]);

  const comments = React.useMemo<TCollabComment[]>(() => {
    if (!provider || !activeThread || !thread) return [];
    return provider.getThreadComments(activeThread, true) || [];
  }, [provider, activeThread, thread]);

  const [firstComment, ...allComments] = comments;

  if (!thread) return null;

  return (
    <div className='tiptap-thread-wrapper' style={isMobile ? { width: '100%' } : {}}>
      <ThreadHeader
        thread={thread}
        threadCount={threadCount}
        currentThreadIndex={currentThreadIndex}
        onPrevThread={prevThread}
        onNextThread={nextThread}
        onResolveUnresolve={handleResolveUnresolve}
        onCopyLink={copyThreadLink}
        onDelete={deleteThread}
        onClose={closeThread}
      />

      <div className='tiptap-thread-content'>
        <div className='tiptap-thread-comments'>
          {firstComment && (
            <Comment
              editor={providedEditor}
              comment={firstComment}
              onDelete={deleteComment}
              onEdit={editComment}
              onReact={handleCommentReaction}
            />
          )}

          {allComments.map((comment) => (
            <Comment
              key={comment.id}
              editor={providedEditor}
              comment={comment}
              onDelete={deleteComment}
              onEdit={editComment}
              onReact={handleCommentReaction}
            />
          ))}
        </div>
      </div>

      <ThreadFooter
        isCommenting={isCommenting}
        setIsCommenting={setIsCommenting}
        onCreateComment={createComment}
      />
    </div>
  );
};
