'use client';

import { useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

type Context = { id: string; type: string };
type UseAIChatProps = { contexts?: Context[] };

export function useInsightChat({ contexts = [] }: UseAIChatProps = {}) {
  const {
    messages,
    sendMessage: rawSendMessage,
    status,
    error,
  } = useChat({
    id: 'insight-chat',
    transport: new DefaultChatTransport({ api: `/api/v2/agents/insight/chat` }),
  });

  const sendMessage = useCallback(
    (input: Parameters<typeof rawSendMessage>[0]) => {
      return rawSendMessage(input, { body: { agentId: 'insight-agent', contexts } });
    },
    [rawSendMessage, contexts],
  );

  return {
    messages,
    sendMessage,
    status,
    error,
  };
}
