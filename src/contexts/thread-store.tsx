'use client';

import * as React from 'react';
import type { TCollabThread } from '@tiptap-pro/provider';
import type { Editor } from '@tiptap/react';

import { useCollab } from '@/contexts/collab-context';
import { useAppState } from '@/contexts/app-context';

export interface ThreadStoreValue {
  threads: TCollabThread[];
  resolvedThreads: TCollabThread[];
  unresolvedThreads: TCollabThread[];
}

export interface ThreadStoreActions {
  nextThread: () => void;
  prevThread: () => void;
}

export interface ThreadStoreContextValue {
  state: ThreadStoreValue;
  actions: ThreadStoreActions;
}

export interface ThreadStoreProps {
  children: React.ReactNode;
  editor: Editor | null;
}

export const initialContextValue: ThreadStoreContextValue = {
  actions: {
    nextThread: () => {},
    prevThread: () => {},
  },
  state: {
    resolvedThreads: [],
    threads: [],
    unresolvedThreads: [],
  },
};

export const ThreadStoreContext = React.createContext<ThreadStoreContextValue>(initialContextValue);

export const useThreadState = () => React.useContext(ThreadStoreContext).state;
export const useThreadActions = () => React.useContext(ThreadStoreContext).actions;
export const useThreadIds = () => {
  const { threads } = useThreadState();
  return threads.map((thread) => thread.id);
};

export function findThreadPosition(thread: TCollabThread, editor: Editor) {
  const view = editor.view;
  if (!view) return 0;

  const firstNode = view.dom.querySelector(`[data-thread-id="${thread.id}"`);
  if (!firstNode) return null;

  return view.posAtDOM(firstNode, 0);
}

export function scrollToActiveThread(activeThread: string | null, editor: Editor) {
  if (!activeThread || !editor.view) return;

  const node = editor.view.dom.querySelector(`[data-thread-id="${activeThread}"]`);
  if (!node) return;

  const topOffset = node.getBoundingClientRect().top;
  if (topOffset > 0 && topOffset < window.innerHeight - 100) return;

  window.scrollTo({
    top: topOffset - 100,
  });
}

export function ThreadStore({ children, editor }: ThreadStoreProps) {
  const { provider } = useCollab();
  const { setActiveThread, activeThread } = useAppState();
  const [threads, setThreads] = React.useState<TCollabThread[]>([]);

  const resolvedThreads = React.useMemo(() => threads.filter((t) => t.resolvedAt), [threads]);

  const unresolvedThreads = React.useMemo(() => threads.filter((t) => !t.resolvedAt), [threads]);

  const nextThread = () => {
    if (!activeThread) {
      setActiveThread(threads[0]?.id || null);
      return;
    }

    const currentIndex = threads.findIndex((t) => t.id === activeThread);
    const nextIndex = (currentIndex + 1) % threads.length;
    setActiveThread(threads[nextIndex]?.id || null);
  };

  const prevThread = () => {
    if (!activeThread) {
      setActiveThread(threads[0]?.id || null);
      return;
    }

    const currentIndex = threads.findIndex((t) => t.id === activeThread);
    const prevIndex = currentIndex - 1 < 0 ? threads.length - 1 : currentIndex - 1;
    setActiveThread(threads[prevIndex]?.id || null);
  };

  /**
   * This effect watches the provider for changes on threads
   * and updates the threads state with a sorted array of threads
   * based on their position.
   */
  React.useEffect(() => {
    if (!provider || !editor) return;

    const handleThreadSync = () => {
      requestAnimationFrame(() => {
        const threadsWithPositions = provider
          .getThreads()
          .map((thread) => ({
            thread,
            pos: findThreadPosition(thread, editor) ?? 0,
          }))
          .filter(({ pos }) => pos !== null)
          .sort((a, b) => a.pos - b.pos);

        setThreads(threadsWithPositions.map(({ thread }) => thread));
      });
    };

    handleThreadSync();
    provider.watchThreads(handleThreadSync);
    provider.on('synced', handleThreadSync);

    return () => {
      provider.unwatchThreads(handleThreadSync);
      provider.off('synced', handleThreadSync);
    };
  }, [provider, editor]);

  /**
   * This effect watches the currently active thread
   * and tries to find its position to jump to
   */
  React.useEffect(() => {
    if (editor) {
      scrollToActiveThread(activeThread, editor);
    }
  }, [activeThread, editor]);

  const contextValue = {
    actions: {
      nextThread,
      prevThread,
    },
    state: {
      threads,
      resolvedThreads,
      unresolvedThreads,
    },
  };

  return <ThreadStoreContext.Provider value={contextValue}>{children}</ThreadStoreContext.Provider>;
}
