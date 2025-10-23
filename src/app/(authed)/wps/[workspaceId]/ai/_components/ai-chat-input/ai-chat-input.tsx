'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor, EditorProvider, EditorContext } from '@tiptap/react';
import { Editor } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import { extensions } from '../extensions';
import { MentionDropdownMenu } from '../dropdowns/mention-dropdown-menu';
import { toast } from 'sonner';

type AIChatInputProps = {
  onSubmit?: (p: { editor: Editor }) => void;
};
export const AIChatInput = (props: AIChatInputProps) => {
  const extsRef = useRef(extensions);
  const [textCount, setTextCount] = useState(0);

  const editor = useEditor({
    extensions: extsRef.current,
    immediatelyRender: false,
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setTextCount(text.trim().length);
    },
  });

  const handleSubmit = () => {
    if (!editor) return;
    if (props.onSubmit) props.onSubmit({ editor });
  };

  return (
    <div className={cn('flex flex-col gap-2')}>
      {editor ? (
        <EditorContext.Provider value={{ editor }}>
          <MentionDropdownMenu editor={editor} />
          <EditorContent
            editor={editor}
            role='textbox'
            className={cn(
              'border rounded-xs',
              'max-h-40',
              'overflow-y-auto',
              //
            )}
          />
        </EditorContext.Provider>
      ) : null}
      <div>
        <Button
          onClick={handleSubmit}
          className='float-right'
          disabled={textCount === 0}
          //
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default AIChatInput;
