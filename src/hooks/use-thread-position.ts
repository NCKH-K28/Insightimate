'use client';

import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { posToDOMRect } from '@tiptap/react';

export type PositionMode = 'both' | 'thread-only' | 'position-only';

export interface UseThreadPositionRectOptions {
  /**
   * The positioning strategy to use.
   * - "both": Use thread bubbles first, fallback to document position
   * - "thread-only": Prioritize thread bubble positions
   * - "position-only": Prioritize document positions
   * @default "both"
   */
  mode?: PositionMode;
  /**
   * The Tiptap editor instance.
   */
  editor: Editor | null;
  /**
   * The ID of the currently active thread.
   */
  activeThread: string | null;
  /**
   * Record mapping thread IDs to their DOM elements.
   */
  threadBubbles: Record<string, HTMLElement[]>;
}

/**
 * Hook that calculates the position of thread elements in a Tiptap editor.
 *
 * Tracks the position of thread elements through DOM measurements and editor position,
 * with support for different positioning strategies and automatic updates on scroll/resize.
 *
 * @param options - Configuration options for thread positioning
 * @returns A DOMRect representing the position of the thread, or null if unavailable
 */
export const useThreadPositionRect = ({
  mode = 'both',
  editor,
  activeThread,
  threadBubbles,
}: UseThreadPositionRectOptions): DOMRect | null => {
  const [bubbleRect, setBubbleRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!editor || !activeThread) return;

    const bubble = threadBubbles[activeThread]?.[0];
    if (!bubble) return;

    const updateRect = () => {
      setBubbleRect(bubble.getBoundingClientRect());
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(bubble);

    editor.view.root.addEventListener('scroll', () => requestAnimationFrame(updateRect), {
      passive: true,
    });

    return () => {
      observer.disconnect();
      editor.view.root.removeEventListener('scroll', () => requestAnimationFrame(updateRect));
    };
  }, [editor, activeThread, threadBubbles, mode]);

  return React.useMemo(() => {
    if (!editor || !activeThread) return null;

    let from: number | null = null;
    let to: number | null = null;

    editor.state.doc.descendants((node, pos) => {
      if (from || to) return;

      const isBlockThread =
        node.type.name === 'blockThread' && node.attrs['data-thread-id'] === activeThread;

      const isInlineThread = node.marks.some(
        (mark) =>
          mark.type.name === 'inlineThread' && mark.attrs['data-thread-id'] === activeThread,
      );

      if (isBlockThread || isInlineThread) {
        from = pos;
        to = pos + node.nodeSize;
      }
    });

    const getPositionRect = () => {
      return from !== null && to !== null ? posToDOMRect(editor.view, from, to) : null;
    };

    const getBubbleRect = () => {
      return bubbleRect || threadBubbles[activeThread]?.[0]?.getBoundingClientRect() || null;
    };

    if (mode === 'thread-only') {
      const threadRect = getBubbleRect();
      return threadRect || getPositionRect();
    }

    if (mode === 'position-only') {
      const positionRect = getPositionRect();
      return positionRect || getBubbleRect();
    }

    const threadBubbleRect = getBubbleRect();
    if (threadBubbleRect) return threadBubbleRect;

    return getPositionRect();
  }, [activeThread, bubbleRect, editor, mode, threadBubbles]);
};
