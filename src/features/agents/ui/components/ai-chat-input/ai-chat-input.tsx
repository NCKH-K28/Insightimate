'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor, EditorContext } from '@tiptap/react';
import { Editor } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import { Mention } from '@tiptap/extension-mention';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { SelectionBar } from './selection-bar';
import { mentionSuggestions } from '../tiptap-nodes/metion-suggestion';

type AIChatInputProps = {
  onSubmit?: (p: { editor: Editor }) => void;
};
// Mention.configure({
//   // renderHTML(props) {
//   //   return [
//   //     'span',
//   //     {
//   //       'data-mention-id': props.node.attrs.id,
//   //       'data-mention-label': props.node.attrs.label,
//   //       class: 'tiptap-mention bg-blue-100 text-blue-800 rounded px-1',
//   //     },
//   //     `[[${props.node.attrs.label}]]`,
//   //   ];
//   // },
//   // renderText: (props) => {
//   //   const { node } = props;
//   //   return `[[${node.attrs.label}]]`;
//   // },
//   suggestion: { char: '[[', allowSpaces: true },
//   HTMLAttributes: { class: 'tiptap-mention bg-blue-100 text-blue-800 rounded px-1' },
// }),
export const AIChatInput = (props: AIChatInputProps) => {
  const extsRef = useRef([
    Document,
    Paragraph,
    Text,
    Mention.configure({
      suggestions: mentionSuggestions,
      // renderHTML: (props) => {
      //   return ['span', {}, `[[${props.node.attrs.label}]]`];
      // },
      HTMLAttributes: { class: 'tiptap-mention bg-blue-100 text-blue-800 rounded px-1' },
    }),
  ]);
  const [textCount, setTextCount] = useState(0);

  const editor = useEditor({
    extensions: extsRef.current,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setTextCount(text.trim().length);
    },
    content: '',
    editorProps: {
      attributes: {
        class: cn(
          'focus:outline-none prose prose-sm max-w-none',
          'max-h-32 overflow-y-auto',
          'prose-p:mb-0 prose-p:mt-0',
        ),
      },
    },
  });

  //log json
  // console.log(JSON.stringify(editor?.getJSON(), null, 2));

  const handleSubmit = () => {
    if (!editor) return;
    if (props.onSubmit) props.onSubmit({ editor });
  };

  return (
    <div className={cn('flex flex-col gap-2', 'border rounded-lg p-2')}>
      <SelectionBar />
      <div>
        <EditorContext.Provider value={{ editor }}>
          <EditorContent editor={editor} />
        </EditorContext.Provider>
      </div>
      <div>
        <Button
          size='sm'
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
