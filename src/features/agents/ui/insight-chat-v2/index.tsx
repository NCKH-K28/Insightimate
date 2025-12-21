'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  PlusIcon,
  RefreshCcwIcon,
  XIcon,
  SparklesIcon,
} from 'lucide-react';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai';
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationActions,
} from '@/components/ai-elements/confirmation';
import { AddSourceButton } from './add-source';
import { ContextOption, ContextsBar } from './contexts-bar';
import { useDefaultContexts } from '../../hooks/use-default-context';
import { useParams, usePathname } from 'next/navigation';
import { ChatInput } from '@/contracts/agents/agents.input';
import { useInsightSuggestions } from '../../hooks/use-insight-suggestions';
import { Skeleton } from '@/components/ui/skeleton';

const toolNameMap: Record<string, string> = {
  get_issue: 'Retrieving Issue from Insightimate',
  list_issues: 'Searching Issues in Insightimate',
  create_issue: 'Creating Issue in Insightimate',
  update_issue: 'Updating Issue in Insightimate',
  patch_issues: 'Patching Issues in Insightimate',
  issue_metrics: 'Getting Issue Metrics from Insightimate',
  get_project: 'Retrieving Project from Insightimate',
  list_projects: 'Searching Projects in Insightimate',
  get_sprint: 'Retrieving Sprint from Insightimate',
  list_sprints: 'Searching Sprints in Insightimate',
};

const models = [{ name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' }];
const ChatBot = () => {
  const pathname = usePathname();
  if (!pathname) throw new Error('Pathname not found');
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Params not found');
  const workspaceId = params.workspaceId;

  const defaultContexts = useDefaultContexts();
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [sources, setSources] = useState<ContextOption[]>(defaultContexts);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate, addToolApprovalResponse } = useChat({
    id: 'insight-chat',
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DefaultChatTransport({ api: `/api/ai/chat` }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;
    const body: ChatInput = { model, sources, workspaceId, pathname };
    sendMessage({ text: message.text || 'Sent with attachments', files: message.files }, { body });
    setInput('');
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  const { data: suggestions, isPending: isLoadingSuggestions } = useInsightSuggestions(workspaceId);

  return (
    <div className='p-2 flex flex-col h-full relative'>
      <Conversation className='h-full'>
        <ConversationContent>
          {messages.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center gap-6 p-8 text-center text-muted-foreground animate-in fade-in zoom-in duration-300'>
              <div className='flex size-20 items-center justify-center rounded-full bg-linear-to-tr from-primary/10 to-primary/5 ring-1 ring-primary/20 shadow-sm'>
                <SparklesIcon className='size-10 text-primary' />
              </div>
              <div className='max-w-md space-y-2'>
                <h3 className='text-xl font-semibold text-foreground'>Insightimate Intelligence</h3>
                <p className='text-sm'>
                  Trợ lý AI cao cấp sẵn sàng hỗ trợ bạn phân tích dự án và quản lý công việc.
                </p>
              </div>
              <div className='flex flex-wrap justify-center gap-2 max-w-lg'>
                {isLoadingSuggestions ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-8 w-32 rounded-full' />
                  ))
                ) : (
                  <>
                    {suggestions?.map((suggestion) => (
                      <button
                        key={suggestion}
                        className='rounded-full bg-muted/50 px-4 py-2 text-xs font-medium hover:bg-muted hover:text-foreground transition-colors border border-transparent hover:border-border cursor-pointer text-left'
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' &&
                  message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={message.parts.filter((part) => part.type === 'source-url').length}
                      />
                      {message.parts
                        .filter((part) => part.type === 'source-url')
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source key={`${message.id}-${i}`} href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  if (isToolUIPart(part)) {
                    const toolName = getToolName(part);

                    // tool cần approval
                    if (part.approval) {
                      return (
                        <div key={`${message.id}-${i}`} className='my-2'>
                          <Confirmation approval={part.approval} state={part.state}>
                            <ConfirmationRequest>
                              Tool <b>{toolName}</b> muốn chạy với input:
                              <pre className='mt-2 text-xs whitespace-pre-wrap'>
                                {JSON.stringify(part.input ?? {}, null, 2)}
                              </pre>
                              Bạn có đồng ý không?
                            </ConfirmationRequest>

                            <ConfirmationAccepted>
                              <CheckIcon className='size-4' />
                              <span>Đã approve</span>
                            </ConfirmationAccepted>

                            <ConfirmationRejected>
                              <XIcon className='size-4' />
                              <span>Đã reject</span>
                            </ConfirmationRejected>

                            <ConfirmationActions>
                              <ConfirmationAction
                                variant='outline'
                                onClick={() => {
                                  addToolApprovalResponse({
                                    id: part.approval!.id,
                                    approved: false,
                                  });
                                }}
                              >
                                Reject
                              </ConfirmationAction>

                              <ConfirmationAction
                                variant='default'
                                onClick={() => {
                                  addToolApprovalResponse({
                                    id: part.approval!.id,
                                    approved: true,
                                  });
                                }}
                              >
                                Approve
                              </ConfirmationAction>
                            </ConfirmationActions>
                          </Confirmation>

                          {/* Nếu tool đã chạy xong hoặc bị deny */}
                          {part.output != null && (
                            <div className='mt-2 text-sm w-full'>
                              <div className='flex items-center gap-2 mb-2 select-none opacity-80'>
                                <CheckIcon className='size-3 text-green-500' />
                                <span className='font-semibold'>Tool Success</span>
                              </div>
                              <CodeBlock
                                code={JSON.stringify(part.output, null, 2)}
                                language='json'
                                className='my-2 max-h-[300px]'
                              >
                                <CodeBlockCopyButton />
                              </CodeBlock>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // tool không cần approval: bạn render nhẹ nhàng tuỳ ý
                    return (
                      <div
                        key={`${message.id}-${i}`}
                        className='my-2 text-xs opacity-70 flex items-center gap-2'
                      >
                        <div className='size-2 rounded-full bg-blue-500 animate-pulse' />
                        <span>
                          Using tool: <b>{toolNameMap[toolName] || toolName}</b>...
                        </span>
                      </div>
                    );
                  } else if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                        {message.role === 'assistant' && i === messages.length - 1 && (
                          <MessageActions>
                            <MessageAction onClick={() => regenerate()} label='Retry'>
                              <RefreshCcwIcon className='size-3' />
                            </MessageAction>
                            <MessageAction
                              onClick={() => navigator.clipboard.writeText(part.text)}
                              label='Copy'
                            >
                              <CopyIcon className='size-3' />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Message>
                    );
                  } else if (part.type === 'reasoning') {
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className='w-full'
                        isStreaming={
                          status === 'streaming' &&
                          i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id
                        }
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  } else {
                    return null;
                  }
                })}
              </div>
            ))
          )}
          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={handleSubmit} className='mt-4' globalDrop multiple>
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <AddSourceButton
            sources={sources}
            onChange={setSources}
            params={{ workspaceId }}
            renderTrigger={() => (
              <PromptInputButton>
                <PlusIcon className='size-4' />
              </PromptInputButton>
            )}
          />

          <ContextsBar selected={sources} onChange={setSources} />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea onChange={(e) => setInput(e.target.value)} value={input} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputButton
              variant={webSearch ? 'default' : 'ghost'}
              onClick={() => setWebSearch(!webSearch)}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
            <PromptInputSelect
              onValueChange={(value) => {
                setModel(value);
              }}
              value={model}
            >
              <PromptInputSelectTrigger>
                <PromptInputSelectValue />
              </PromptInputSelectTrigger>
              <PromptInputSelectContent>
                {models.map((model) => (
                  <PromptInputSelectItem key={model.value} value={model.value}>
                    {model.name}
                  </PromptInputSelectItem>
                ))}
              </PromptInputSelectContent>
            </PromptInputSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={!input && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
};
export default ChatBot;
