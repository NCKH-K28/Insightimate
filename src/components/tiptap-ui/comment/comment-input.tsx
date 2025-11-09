'use client';

import * as React from 'react';
import type { JSONContent, Editor } from '@tiptap/react';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

// Tiptap Core Extensions
import { StarterKit } from '@tiptap/starter-kit';
import { Mention } from '@tiptap/extension-mention';
import { Placeholder, Selection } from '@tiptap/extensions';
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji';

// --- Icons ---
import { ArrowRightIcon } from '@/components/tiptap-icons/arrow-right-icon';
import { CloseIcon } from '@/components/tiptap-icons/close-icon';

// --- Lib ---
import { removeEmptyParagraphs } from '@/lib/tiptap-collab-utils';

// --- Tiptap UI ---
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { EmojiTriggerButton } from '@/components/tiptap-ui/emoji-trigger-button';
import { MentionTriggerButton } from '@/components/tiptap-ui/mention-trigger-button';
import { LinkPopover } from '@/components/tiptap-ui/link-popover';
import { EmojiDropdownMenu } from '@/components/tiptap-ui/emoji-dropdown-menu';
import { MentionDropdownMenu } from '@/components/tiptap-ui/mention-dropdown-menu';

// --- UI Primitives ---
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import { Spacer } from '@/components/tiptap-ui-primitive/spacer';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar';

// --- Styles ---
import '@/components/tiptap-ui/comment/comment-input.scss';

interface CommentInputProps {
  onSend: (content: JSONContent) => void;
  onCancel?: () => void;
  onBlur?: () => void;
  onEmptyBlur?: () => void;
  open?: boolean;
  onOpen?: () => void;
  showCancel?: boolean;
  content?: JSONContent;
  floating?: boolean;
  placeholder?: string;
}

const ClosedCommentInput: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <div className='tiptap-comment-input-toolbar' onClick={onOpen}>
    <div className='tiptap-comment-input-content'>Reply to thread ...</div>
    <ButtonGroup orientation='horizontal'>
      <Button data-style='ghost' disabled>
        <ArrowRightIcon className='tiptap-button-icon' />
      </Button>
    </ButtonGroup>
  </div>
);

const CommentToolbar: React.FC<{
  editor: Editor | null;
  onCancel?: () => void;
  onSend: () => void;
  showCancel: boolean;
  setIsLinkPopoverOpen: (open: boolean) => void;
}> = ({ editor, onCancel, onSend, showCancel, setIsLinkPopoverOpen }) => (
  <Toolbar variant='floating' data-plain='true' className='tiptap-comment-input-toolbar'>
    <ToolbarGroup>
      <EmojiTriggerButton />
      <MentionTriggerButton />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type='bold' />
      <MarkButton type='italic' />
      <MarkButton type='strike' />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <LinkPopover onOpenChange={setIsLinkPopoverOpen} editor={editor} />
    </ToolbarGroup>
    <Spacer />
    <ToolbarGroup>
      {showCancel && onCancel && (
        <Button type='submit' onClick={onCancel} data-style='ghost' tooltip='Cancel'>
          <CloseIcon className='tiptap-button-icon' />
        </Button>
      )}
      <Button
        type='submit'
        onClick={onSend}
        disabled={!editor || editor?.isEmpty}
        data-style='primary'
        tooltip='Submit'
      >
        <ArrowRightIcon className='tiptap-button-icon' />
      </Button>
    </ToolbarGroup>
  </Toolbar>
);

export const CommentInput: React.FC<CommentInputProps> = ({
  onSend,
  onCancel,
  onBlur,
  onEmptyBlur,
  onOpen,
  content,
  open = true,
  showCancel = false,
  floating = false,
  placeholder = 'Write a comment...',
}) => {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false);
  const commentInputRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: true,
    content,
    extensions: [
      StarterKit.configure({
        heading: false,
        link: {
          openOnClick: false,
        },
      }),
      Selection,
      Placeholder.configure({ placeholder }),
      Mention,
      Emoji.configure({
        emojis: gitHubEmojis.filter((emoji) => !emoji.name.includes('regional')),
        forceFallbackImages: true,
      }),
    ],
  });

  const handleSend = React.useCallback(() => {
    if (!editor) return;

    const doc = editor.getJSON();
    const content = removeEmptyParagraphs(doc);
    onSend(content);
    editor.chain().clearContent().focus().run();
  }, [editor, onSend]);

  const handleBlurCheck = React.useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const hasFocus = e.currentTarget.contains(e.relatedTarget as Node);
      if (hasFocus) return;

      if (editor?.isEmpty && onEmptyBlur && !isLinkPopoverOpen) {
        onEmptyBlur();
      } else if (onBlur) {
        onBlur();
      }
    },
    [editor?.isEmpty, isLinkPopoverOpen, onBlur, onEmptyBlur],
  );

  const handleOnOpen = React.useCallback(() => {
    if (onOpen) {
      onOpen();
      editor?.chain().focus().run();
    }
  }, [editor, onOpen]);

  return (
    <div
      className='tiptap-comment-input'
      data-floating={floating}
      data-focused={editor?.isFocused}
      data-active-state={open ? 'on' : 'off'}
      ref={commentInputRef}
      onBlur={handleBlurCheck}
    >
      {open ? (
        <EditorContext.Provider value={{ editor }}>
          <MentionDropdownMenu />
          <EmojiDropdownMenu />
          <EditorContent className='tiptap-comment-input-content' editor={editor} />
          <CommentToolbar
            editor={editor}
            onCancel={onCancel}
            onSend={handleSend}
            showCancel={showCancel}
            setIsLinkPopoverOpen={setIsLinkPopoverOpen}
          />
        </EditorContext.Provider>
      ) : (
        <ClosedCommentInput onOpen={handleOnOpen} />
      )}
    </div>
  );
};
