// features/agents/types/chat.ts
import type { Content } from '@tiptap/core';

/**
 * Issue do tool issue_generator trả về
 * (match với ZIssueGenerationOutput)
 */
export type GeneratedIssue = {
  id: string;
  summary: string;
  description: string | null;
  story_points: number | null;
  parent_id?: string | null;
  due_date: string | null;
  priority: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
};

/**
 * Metadata cho mỗi message (gửi từ client lên)
 */
export type MessageMetadata = {
  doc?: Content;
  timezone?: string;
  // Có thể thêm field khác tuỳ bạn
  [key: string]: any;
};

/**
 * Message “sạch” dùng cho UI
 */
export type AppMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';

  // Nếu bạn muốn render lại doc từ Tiptap JSON
  doc?: Content;

  // Fallback text (plain/markdown)
  text?: string;

  // Output từ tool issue_generator
  toolIssues?: {
    issues: GeneratedIssue[];
    projectId?: string;
  }[];
};
