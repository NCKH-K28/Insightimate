'use client';

import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

import { useEditor } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';

import AIChatInput from '@/features/agents/ui/components/ai-chat-input/ai-chat-input';

import { outputExtensions } from '../extensions';
import { isTiptapJSONContent } from '../utils';

import { GeneratedIssuesPanel } from './generated-issues-panel';
import { useAgentChat } from '@/features/agents/hooks/use-agent-chat';
import { AppMessage } from '@/features/agents/types/chat';

type ChatPanelProps = { params: { agentId: string; projectId?: string } };

export function ChatPanel({ params }: ChatPanelProps) {
  const { messages, sendUserMessage, isLoading, error } = useAgentChat(
    params.agentId,
    params.projectId,
  );

  // Editor ẩn để convert markdown -> HTML (nếu bạn muốn giữ markdown)
  const markdownEditor = useEditor({
    extensions: outputExtensions,
    immediatelyRender: false,
  });

  const defaultTimezone = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  }, []);

  const markdownToHtml = (markdown: string): string => {
    if (!markdownEditor || !markdown) return '';
    markdownEditor.commands.setContent(markdown, { contentType: 'markdown' });
    const html = markdownEditor.getHTML();
    markdownEditor.commands.clearContent();
    return html;
  };

  const renderHTML = (html: string): React.ReactNode => (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className='prose prose-sm focus:outline-none max-w-none leading-6'
    />
  );

  const renderMessageContent = (m: AppMessage): React.ReactNode => {
    if (m.toolIssues?.length) {
      return (
        <>
          {m.toolIssues.map((block, idx) => (
            <GeneratedIssuesPanel
              key={idx}
              issues={block.issues}
              projectId={block.projectId || params.projectId || 'PROJ1'}
            />
          ))}
          {m.text && renderHTML(markdownToHtml(m.text))}
        </>
      );
    }

    // 2) Nếu có doc -> render bằng Tiptap
    if (m.doc && isTiptapJSONContent(m.doc)) {
      const html = generateHTML(m.doc, outputExtensions);
      return renderHTML(html);
    }

    // 3) Nếu chỉ có text -> markdown -> HTML
    if (m.text) {
      const html = markdownToHtml(m.text);
      return renderHTML(html);
    }

    return <div className='text-xs text-muted-foreground'>Không có nội dung</div>;
  };

  return (
    <div className={cn('mx-auto h-full flex flex-col', 'p-2 border')}>
      <article className='flex-1 overflow-auto flex flex-col gap-2 pb-2'>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className='w-full'>
              <div
                className={cn('w-full px-2 py-1 rounded-md', {
                  'w-auto max-w-lg': isUser,
                  'bg-accent-foreground/5': isUser,
                  'ml-auto': isUser,
                  'border border-accent-foreground/10': isUser,
                })}
              >
                <div className='prose prose-sm max-w-none'>{renderMessageContent(m)}</div>
              </div>
            </div>
          );
        })}

        {isLoading && <div className='text-xs text-muted-foreground px-2 py-1'>Đang suy nghĩ…</div>}

        {error && <div className='text-xs text-red-500 px-2 py-1'>Lỗi: {String(error)}</div>}
      </article>

      <div className='w-full pt-2 mt-2 border-t'>
        <AIChatInput
          onSubmit={async ({ editor }) => {
            const text = editor.getText();
            const doc = editor.getJSON();
            const timezone = defaultTimezone;

            editor.commands.clearContent();

            await sendUserMessage({ text, doc, timezone });
          }}
        />
      </div>
    </div>
  );
}

export default ChatPanel;
