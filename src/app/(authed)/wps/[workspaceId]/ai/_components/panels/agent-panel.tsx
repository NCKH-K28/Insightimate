'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useMemo, useRef } from 'react';
import AiChatInput from '../ai-chat-input/ai-chat-input';
import { cn } from '@/lib/utils';
import { Content } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';

import { extensions } from '../extensions';
import { isTiptapJSONContent } from '../utils';

const getHeaderMarkdown = () => {
  return `
# Welcome to the AI Chat
This is a chat interface where you can interact with an AI assistant.
You can ask questions, get help, and explore various topics!
* Your issue: [[issue:PROJ1-1|Issue One]]
  `;
};

function Chat() {
  const extsRef = useRef(extensions);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: '/api/v2/ai/chat' }),
  });

  const editor = useEditor({
    extensions: extsRef.current,
    immediatelyRender: false,
  });

  const markdownToHtml = (markdown: string): string => {
    if (!editor || !markdown) return '';
    editor.commands.setContent(markdown, { contentType: 'markdown' });
    const html = editor.getHTML();
    editor.commands.setContent('');
    return html;
  };

  const defaultTimezone = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  }, []);

  const renderMessageContent = (message: UIMessage): React.ReactNode => {
    try {
      const meta: Content = message.metadata || {};
      if (isTiptapJSONContent(meta.doc)) {
        const html = generateHTML(meta.doc, extsRef.current);
        return <div dangerouslySetInnerHTML={{ __html: html }} style={{ width: '100%' }} />;
      }

      const renderTextParts = (p: UIMessage['parts'][number], index: number): string => {
        if (!p) return '';

        if ('delta' in p && typeof p.delta === 'string') return p.delta;
        if (p.type === 'text') return p.text || '';
        if (p.type === 'step-start') return '';
        if (p.type === 'tool-getTime') {
          const output = p.output;
          if (output && typeof output === 'string') {
            return output;
          }
          return '';
        }
        return `Unsupported part type: ${p.type}`;
      };

      // Safely handle parts array
      const parts = message.parts || [];
      const texts = parts.map((part, index) => renderTextParts(part, index));
      const combinedText = texts.join('\n\n').trim();

      if (!combinedText.trim()) {
        return <div>No content available</div>;
      }

      const html = markdownToHtml(combinedText);
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <div className='text-red-500'>Error rendering message</div>;
    }
  };

  const renderHeader = () => {
    const title = getHeaderMarkdown();
    const html = markdownToHtml(title);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={cn('max-w-2xl mx-auto h-full flex flex-col', 'p-2 border')}>
      <div className='w-full border-b mb-1'>
        <div className='prose prose-sm'>{renderHeader()}</div>
      </div>

      <article
        className={cn(
          'flex-1 overflow-auto',
          'flex flex-col gap-4',
          //
        )}
      >
        {messages.map((message, index) => {
          return (
            <div key={index} className='w-full'>
              <div
                className={cn('w-full px-2 py-0', 'flex-1', {
                  'bg-accent-foreground/5': message.role === 'user',
                  'max-w-lg': message.role === 'user',
                  'ml-auto': message.role === 'user',
                  'border border-accent-foreground/10': message.role === 'user',
                })}
              >
                <div className={cn('prose prose-sm max-w-none')}>
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          );
        })}
      </article>
      <div className={cn('w-full pt-2 mt-2 border-t')}>
        <AiChatInput
          onSubmit={async ({ editor }) => {
            const text = editor.getText();
            const doc = editor.getJSON();
            const timezone = defaultTimezone;

            const metadata: Record<string, any> = { timezone, doc };
            editor.commands.clearContent();
            await sendMessage({ text, metadata });
          }}
        />
      </div>
    </div>
  );
}

export default Chat;
