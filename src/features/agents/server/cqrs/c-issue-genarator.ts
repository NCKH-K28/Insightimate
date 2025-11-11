/* eslint-disable @typescript-eslint/no-unused-vars */

import { elasticClient } from '@/lib/elastic';
import { generateObject, generateText, Output, stepCountIs, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { hfClient } from '@/lib/huggingface';
import { z } from 'zod';

const ZIssueContext = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().nullable(),
  story_points: z.number().nullable(),
  due_date: z.coerce.date().nullable(),
  parent_id: z.string().nullish(),
});

const ZIssueDraft = z.object({
  id: z.string().describe('Unique identifier of the issue'),
  summary: z.string().describe('Summary or title of the issue'),
  description: z.string().nullable().describe('Detailed description of the issue'),
  story_points: z.number().nullable().describe('Story points assigned to the issue'),
  parent_id: z.string().nullish().describe('Parent issue ID, if any'),
  due_date: z.string().nullable().describe('Due date of the issue in ISO format'),
  priority: z.enum(['Very Low', 'Low', 'Medium', 'High', 'Very High']),
});

export const ZIssueGenerationOutput = z.object({
  version: z.literal('1.0'),
  data: z.array(ZIssueDraft),
});
export type IssueGenerationOutput = z.infer<typeof ZIssueGenerationOutput>;
export type IssueContext = z.infer<typeof ZIssueContext>;

const embed = async (input: string): Promise<number[]> => {
  const vec = await hfClient.featureExtraction({
    model: 'sentence-transformers/all-mpnet-base-v2',
    inputs: [input],
    options: { wait_for_model: true },
  });
  return Array.isArray(vec[0]) ? (vec[0] as number[]) : (vec as number[]);
};

const retrieveRelatedIssues = async (
  input: { text: string },
  context: { actorId: string },
): Promise<IssueContext[]> => {
  // Tạm thời lấy tất cả,
  // sau này sẽ dùng embedding để tìm issue liên quan hơn
  const res = await elasticClient.search({ index: 'issues', query: { match_all: {} } });

  const hits = res.hits.hits;
  return hits.map((hit) => {
    const source = hit._source as any;
    return {
      id: source.id,
      summary: source.summary,
      description: source.description,
      story_points: source.story_points,
      due_date: source.due_date,
      parent_id: source.parent_id,
    };
  });
};

const ResponseSchema = z.toJSONSchema(ZIssueGenerationOutput);
const getSystemPrompt = (responseSchema: unknown = ResponseSchema) =>
  `
You are an issue-generation agent for a Jira-like system.

Output (strict)
- Return ONE JSON object only, no explanations, no extra text.
- Must match this schema exactly: ${JSON.stringify(responseSchema, null, 2)}

Task
- Based on the user's request and the "relatedIssues" (if any), create a LIST of new issues that strictly follows the schema below.
- Use relatedIssues to: avoid duplicates by summary/description, infer parent–child relationships, and mimic the ID pattern.
- If you cannot create a non-duplicate issue, return an empty but valid structure according to the schema.

ID rules (if present in the schema)
- Take the prefix from relatedIssues (e.g. APP-12 → APP-<new_number>) and do not reuse existing IDs.
- If you cannot infer a prefix, use "GEN-1", "GEN-2", ...
- If the issue is a subtask/part of another issue in the context, set parent/parent_id to the parent issue ID.

Value rules
- due_date: if missing → null; if present → "YYYY-MM-DD".
- priority: if unclear → "Medium".

Decomposition rules
- If the description is a large task with multiple steps/groups, split it into multiple smaller, actionable issues.
`.trim();

const formatTextJSON = (text: string) => {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON object found in the text');
  return match[0];
};

export const issueGenerator = async (
  input: { text: string; context?: { projectId?: string } },
  context: { actorId: string },
) => {
  const systemPrompt = getSystemPrompt();

  const { text, usage } = await generateText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: [{ role: 'user', content: input.text }],
    tools: {
      getRelatedIssues: tool({
        name: 'get_related_issues',
        description: 'Retrieve related issues based on user input',
        inputSchema: z.object({
          text: z.string().describe('The user input text for issue generation'),
        }),
        execute: (toolInput) => retrieveRelatedIssues(toolInput, context),
      }),
    },
    temperature: 0.2,
    stopWhen: stepCountIs(3),
  });

  // log token
  console.log('Issue Generation LLM usage:', usage);

  const formattedText = formatTextJSON(text);
  const jsonData = JSON.parse(formattedText);
  return ZIssueGenerationOutput.parse(jsonData);
};
