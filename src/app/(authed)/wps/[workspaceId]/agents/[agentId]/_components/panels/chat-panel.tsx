'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Content } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';

import AIChatInput from '@/features/agents/ui/components/ai-chat-input/ai-chat-input';

import { outputExtensions } from '../extensions';
import { isTiptapJSONContent } from '../utils';

const getHeaderMarkdown = () => {
  return `
# Welcome to the AI Chat
This is a chat interface where you can interact with an AI assistant.
You can ask questions, get help, and explore various topics!
* Your issue: [[issue:PROJ1-1|Issue One]]
`;
};

type ChatPanelProps = { params: { agentId: string } };
export function ChatPanel({ params }: ChatPanelProps) {
  const extsRef = useRef(outputExtensions);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/v2/agents/${params.agentId}/chat`,
      body: { agentId: params.agentId },
    }),
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

  const renderHTML = (html: string): React.ReactNode => {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className='prose prose-sm focus:outline-none max-w-none leading-6 p-1'
      />
    );
  };

  const renderMessageContent = (message: UIMessage): React.ReactNode => {
    try {
      const meta: Content = message.metadata || {};
      if (isTiptapJSONContent(meta.doc)) {
        const html = generateHTML(meta.doc, extsRef.current);
        return renderHTML(html);
      }

      const renderTextParts = (p: UIMessage['parts'][number]): string => {
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
      const texts = parts.map((part) => renderTextParts(part));
      const combinedText = texts.join('\n\n').trim();

      if (!combinedText.trim()) {
        return <div>No content available</div>;
      }

      const html = markdownToHtml(combinedText);
      return renderHTML(html);
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <div className='text-red-500'>Error rendering message</div>;
    }
  };

  const renderHeader = () => {
    const title = getHeaderMarkdown();
    const html = markdownToHtml(title);
    return renderHTML(html);
  };

  return (
    <div className={cn('mx-auto h-full flex flex-col', 'p-2 border')}>
      <div className='w-full border-b mb-1'>
        <div className='prose prose-sm'>{renderHeader()}</div>
      </div>

      <article className={cn('flex-1 overflow-auto', 'flex flex-col gap-2')}>
        {messages.map((message, index) => {
          return (
            <div key={index} className='w-full'>
              <div
                className={cn('w-full px-2 py-0', {
                  'w-auto max-w-lg': message.role === 'user',
                  'bg-accent-foreground/5': message.role === 'user',
                  'ml-auto': message.role === 'user',
                  'border border-accent-foreground/10': message.role === 'user',
                  'rounded-md': true,
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
        <AIChatInput
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

export default ChatPanel;
