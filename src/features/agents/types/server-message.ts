// features/agents/types/server-message.ts
import type { UIMessage } from 'ai';
import type { MessageMetadata, GeneratedIssue } from './chat';

/**
 * UIMessage generic với metadata là MessageMetadata
 */
export type MyUIMessage = UIMessage<MessageMetadata>;

/**
 * UIMessage trên client, có thêm typing cho parts (tool, text, ...)
 */
export type AgentUIMessage = MyUIMessage & {
  parts: (
    | { type: 'text'; text: string }
    | { type: 'step-start'; [k: string]: any }
    | {
        type: 'tool-issuesGeneratorTool'; // ⭐ đúng với log bạn gửi
        state: string;
        output?: {
          data?: GeneratedIssue[]; // ⭐ data, không phải issues
          version?: string;
        };
      }
    | { type: string; [k: string]: any } // các loại khác
  )[];
};
