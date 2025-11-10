 

'use client';

import * as React from 'react';
import type { EmojiItem } from '@tiptap/extension-emoji';
import type { Editor } from '@tiptap/react';

// --- Contexts ---
import { useUser } from '@/contexts/user-context';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Icons ---
import { SmilePlusIcon } from '@/components/tiptap-icons/smile-plus-icon';

// --- Tiptap UI ---
import { EmojiMenu } from '@/components/tiptap-ui/emoji-menu';

// --- UI Primitives ---
import { Button } from '@/components/tiptap-ui-primitive/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/tiptap-ui-primitive/popover';

const getEmojiByName = (name: string, emojis: EmojiItem[]) => {
  const emojiData = emojis.find((emoji) => emoji.name === name);
  return emojiData;
};

export type CommentReactionId = string;
export type CommentReactionRecord = Record<CommentReactionId, string[]>;
export type CommentReactionsProps = {
  editor?: Editor | null;
  reactions: CommentReactionRecord;
  onReact: (reactionId: CommentReactionId) => void;
  onOpenChange?: (open: boolean) => void;
};

export const CommentReactions = ({
  editor: providedEditor,
  onReact,
  onOpenChange,
  reactions,
}: CommentReactionsProps) => {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();

  const handleEmojiPick = React.useCallback(
    (emoji: EmojiItem) => {
      onReact(emoji.name);
      setIsOpen(false);
    },
    [onReact],
  );

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const reactionArray = React.useMemo(() => {
    const reactionArr: Array<{
      id: string;
      count: number;
      userIds: string[];
      isActive?: boolean;
    }> = [];

    Object.entries(reactions).forEach(([reactionId, userIds]) => {
      if (userIds) {
        reactionArr.push({
          id: reactionId,
          count: userIds.length,
          userIds: userIds,
          isActive: user?.id ? userIds.includes(user.id) : false,
        });
      }
    });

    return reactionArr.filter((reaction) => reaction.count > 0);
  }, [reactions, user]);

  const emojis = React.useMemo(() => {
    if (!editor || !editor.extensionStorage.emoji) {
      console.warn(
        'Emoji extension is not available in the editor. Ensure you have the emoji extension configured.',
      );
      return [];
    }

    return editor.extensionStorage.emoji.emojis;
  }, [editor]);

  const getEmoji = React.useCallback(
    (reactionId: string) => {
      const emoji = getEmojiByName(reactionId, emojis);
      return {
        fallbackImage: emoji?.fallbackImage ?? '',
        name: emoji?.name ?? reactionId,
      };
    },
    [emojis],
  );

  return (
    <div className='tiptap-comment-reactions'>
      {reactionArray.map((reaction) => (
        <Button
          key={reaction.id}
          onClick={() => onReact(reaction.id)}
          data-size='small'
          data-active-state={reaction.isActive ? 'on' : 'off'}
          data-style='subtle'
          data-appearance={reaction.isActive ? 'emphasized' : 'default'}
        >
          <img
            src={getEmoji(reaction.id).fallbackImage}
            alt={getEmoji(reaction.id).name}
            className='tiptap-button-emoji'
          />

          {reaction.count > 1 && <span className='tiptap-button-text'>{reaction.count}</span>}
        </Button>
      ))}

      <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
        <PopoverTrigger asChild>
          <Button
            data-size='small'
            data-style='ghost'
            disabled={!emojis.length}
            data-disabled={!emojis.length}
          >
            <SmilePlusIcon className='tiptap-button-icon' />
          </Button>
        </PopoverTrigger>

        <PopoverContent side='left' align='start'>
          <EmojiMenu onSelect={handleEmojiPick} showSearch={true} emojis={emojis} />
        </PopoverContent>
      </Popover>
    </div>
  );
};
