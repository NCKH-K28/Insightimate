import { cn } from '@/lib/utils';
import PromptInput from './prompt-input';
import { useInsightChat } from '../../hooks/use-insight-chat';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceQueryOptions } from '@/features/workspaces/api/actions';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { useMemo, useState } from 'react';

const useDefaultContexts = () => {
  const params = useParams<{ workspaceId?: string; projectId?: string; issueId?: string }>();
  if (!params) throw new Error('Params not found');

  const { data: workspace } = useQuery({
    ...getWorkspaceQueryOptions({ workspaceId: params.workspaceId || '' }),
    enabled: !!params.workspaceId,
  });

  const { data: project } = useQuery({
    ...getProjectQueryOptions({ projectId: params.projectId || '' }),
    enabled: !!params.projectId,
  });

  const contexts: { id: string; type: string; name: string; iconURL?: string }[] = [];
  if (workspace) {
    contexts.push({ id: workspace.id, type: 'workspace', name: workspace.name });
  }
  if (project) {
    contexts.push({ id: project.id, type: 'project', name: project.name, iconURL: project.avatar });
  }
  if (params.issueId) {
    contexts.push({ id: params.issueId, type: 'issue', name: 'Issue' });
  }

  return contexts;
};

export const InsightChatForm = () => {
  const defaultContexts = useDefaultContexts();
  const lastContext = useMemo(() => {
    if (!defaultContexts || defaultContexts.length === 0) return undefined;
    return defaultContexts[defaultContexts.length - 1];
  }, [defaultContexts]);

  const [contexts, setContexts] = useState<
    { id: string; type: string; name: string; iconURL?: string }[]
  >(lastContext ? [lastContext] : []);

  const { messages, sendMessage } = useInsightChat({ contexts });

  const handleSubmit = (value: string) => {
    sendMessage({ text: value });
  };

  return (
    <div className={cn('flex flex-col h-full', 'p-2', 'gap-2')}>
      <div className='flex-1 overflow-y-auto px-2 py-4 bg-secondary/50 rounded-lg border border-secondary/50'>
        {/*  */}
        <div className='flex flex-col gap-4'>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('max-w-[80%] p-2 rounded-lg', {
                'self-end bg-primary text-primary-foreground': msg.role === 'user',
                'self-start bg-popover text-popover-foreground': msg.role !== 'user',
              })}
            >
              {msg.parts
                .filter((part) => part.type === 'text')
                .map((part, index) => (
                  <p key={index} className='whitespace-pre-wrap'>
                    {(part as { type: 'text'; text: string }).text}
                  </p>
                ))}
            </div>
          ))}
        </div>
      </div>
      <div>
        <PromptInput
          onSubmit={handleSubmit}
          defaultContexts={lastContext ? [lastContext] : []}
          onContextsChange={(nextContexts) => {
            setContexts(nextContexts);
          }}
        />
      </div>
    </div>
  );
};
