'use client';

import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import type { AgentUIMessage } from '../types/server-message';
import type { AppMessage, GeneratedIssue, MessageMetadata } from '../types/chat';

function uiMessageToAppMessage(m: AgentUIMessage, projectIdFallback?: string): AppMessage {
  const meta: MessageMetadata = (m.metadata || {}) as any;
  const parts = m.parts || [];

  const toolIssuesParts = parts.filter(
    (p: any) =>
      p.type === 'tool-issuesGeneratorTool' && p.state === 'output-available' && p.output?.data,
  ) as any[];

  const toolIssues =
    toolIssuesParts.length > 0
      ? toolIssuesParts.map((part) => ({
          issues: part.output.data as GeneratedIssue[],
          projectId: projectIdFallback,
        }))
      : undefined;

  // 2) doc Tiptap từ metadata
  const doc = meta.doc;

  // 3) text fallback – ghép text từ parts
  const textParts = parts
    .map((p: any) => {
      if (typeof p.delta === 'string') return p.delta;
      if (p.type === 'text') return p.text || '';
      return '';
    })
    .filter(Boolean);

  const text = textParts.join('\n\n').trim() || undefined;

  return {
    id: m.id,
    role: m.role as AppMessage['role'],
    doc,
    text,
    toolIssues,
  };
}

/**
 * Hook chính dùng trong ChatPanel
 */
export function useAgentChat(agentId: string, projectId?: string) {
  const {
    messages: uiMessages,
    sendMessage,
    status,
    error,
  } = useChat<AgentUIMessage>({
    id: `agent-${agentId}`,
    transport: new DefaultChatTransport({
      api: `/api/v2/agents/${agentId}/chat`,
      body: { agentId }, // body bạn đã dùng ở backend
    }),
  });

  const messages: AppMessage[] = useMemo(
    () => uiMessages.map((m) => uiMessageToAppMessage(m, projectId)),
    [uiMessages, projectId],
  );

  const sendUserMessage = async (args: { text: string; doc?: any; timezone?: string }) => {
    const { text, doc, timezone } = args;
    const metadata: MessageMetadata = { doc, timezone };
    await sendMessage({ text, metadata });
  };
  const isLoading = status === 'submitted' || status === 'streaming';
  return {
    messages,
    sendUserMessage,
    isLoading,
    status,
    error,
  };
}
