/**
 * LLM Analysis Utility
 *
 * Helper for structured LLM analysis across agent tools
 */

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export interface LLMAnalyzeOptions<T extends z.ZodTypeAny> {
  schema: T;
  prompt: string;
  systemContext?: string;
  model?: string;
}

/**
 * Call LLM to generate structured output matching a Zod schema
 */
export async function llmAnalyze<T extends z.ZodTypeAny>({
  schema,
  prompt,
  systemContext,
  model = 'gemini-2.0-flash',
}: LLMAnalyzeOptions<T>): Promise<z.infer<T>> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

  if (systemContext) {
    messages.push({ role: 'system', content: systemContext });
  }

  messages.push({ role: 'user', content: prompt });

  const { object } = await generateObject({
    model: google(model),
    schema,
    messages,
  });

  return object as z.infer<T>;
}

/**
 * Build context string from issue data
 */
export function buildIssueContext(issue: {
  key?: string;
  summary: string;
  description?: string | null;
  type?: { name: string } | null;
  priority?: { name: string } | null;
  status?: { name: string; category?: string } | null;
  dueDate?: Date | null;
  storyPoints?: number | null;
}): string {
  const lines = [
    `Issue: ${issue.key || 'N/A'}`,
    `Summary: ${issue.summary}`,
    `Type: ${issue.type?.name || 'N/A'}`,
    `Priority: ${issue.priority?.name || 'N/A'}`,
    `Status: ${issue.status?.name || 'N/A'}`,
  ];

  if (issue.dueDate) {
    lines.push(`Due Date: ${issue.dueDate.toISOString().split('T')[0]}`);
  }

  if (issue.storyPoints) {
    lines.push(`Story Points: ${issue.storyPoints}`);
  }

  if (issue.description) {
    lines.push(`\nDescription:\n${issue.description}`);
  }

  return lines.join('\n');
}

/**
 * Build context from multiple issues
 */
export function buildIssuesContext(
  issues: Array<{
    key?: string;
    summary: string;
    description?: string | null;
  }>,
): string {
  return issues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.key || 'N/A'}] ${issue.summary}\n   ${(issue.description || '').slice(0, 200)}...`,
    )
    .join('\n\n');
}
