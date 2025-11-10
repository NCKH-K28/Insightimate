'use client';

import * as React from 'react';
import { type Editor } from '@tiptap/react';

// --- Lib ---
import { parseShortcutKeys } from '@/lib/tiptap-utils';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Tiptap UI ---
import { COMMENT_SHORTCUT_KEY, useComment } from '@/components/tiptap-ui/comment-button';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';
import { Badge } from '@/components/tiptap-ui-primitive/badge';

export interface CommentButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Whether the button should hide when commenting is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Control visibility for resolved block threads
   * @default true
   */
  showOnResolvedBlockThreads?: boolean;
  /**
   * Callback function called after a successful comment addition.
   */
  onCommented?: () => void;
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean;
}

export function CommentShortcutBadge({
  shortcutKeys = COMMENT_SHORTCUT_KEY,
}: {
  shortcutKeys?: string;
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Button component for adding a comment in a Tiptap editor.
 *
 * For custom button implementations, use the `useComment` hook instead.
 */
export const CommentButton = React.forwardRef<HTMLButtonElement, CommentButtonProps>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      showOnResolvedBlockThreads = true,
      onCommented,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const { isVisible, canComment, handleComment, label, shortcutKeys, Icon } = useComment({
      editor,
      hideWhenUnavailable,
      showOnResolvedBlockThreads,
      onCommented,
    });

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        handleComment();
      },
      [handleComment, onClick],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Button
        type='button'
        data-style='ghost'
        disabled={!canComment}
        data-disabled={!canComment}
        role='button'
        tabIndex={-1}
        aria-label={label}
        tooltip='Add comment'
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className='tiptap-button-icon' />
            {text && <span className='tiptap-button-text'>{text}</span>}
            {showShortcut && <CommentShortcutBadge shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    );
  },
);

CommentButton.displayName = 'CommentButton';
