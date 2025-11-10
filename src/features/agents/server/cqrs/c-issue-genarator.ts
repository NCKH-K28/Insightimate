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
Bạn là tác nhân tạo issue cho hệ thống kiểu Jira.

Nhiệm vụ
- Dựa trên yêu cầu người dùng và "relatedIssues" (nếu có), tạo DANH SÁCH issue mới theo đúng schema ở cuối.
- Dùng relatedIssues để: tránh trùng theo summary/mô tả, suy ra quan hệ cha–con, và bắt chước pattern ID.
- Nếu không thể tạo issue mới mà không trùng, trả về cấu trúc rỗng hợp lệ theo schema.

Định dạng bắt buộc
- Chỉ trả về MỘT JSON hợp lệ đúng schema.
- Không markdown, không giải thích, không \`\`\`, không thêm field ngoài schema.
- Key phải đúng tên trong schema; nội dung text (summary, description, …) dùng cùng ngôn ngữ với người dùng.
- Field cho phép null mà thiếu dữ liệu thì để null.

Quy tắc ID (nếu schema có)
- Lấy prefix từ relatedIssues (vd: APP-12 → APP-<số_mới>), không trùng ID đã có.
- Nếu không suy ra được prefix thì dùng "GEN-1", "GEN-2", ...
- Nếu issue là phần việc của issue trong context thì điền parent/parent_id theo ID issue cha.

Quy tắc điền giá trị
- due_date: không có → null; có → "YYYY-MM-DDTHH:mm:ssZ" (UTC, không tự bịa ngày).
- priority: không rõ → "Medium".
- story_points: không ước lượng được → null.

Quy tắc tách nhỏ
- Nếu mô tả là hạng mục lớn gồm nhiều bước/nhóm việc khác nhau thì tách thành nhiều issue nhỏ, thực thi được.

Schema đầu ra:
${JSON.stringify(responseSchema, null, 2)}
`.trim();

const formatTextJSON = (text: string) => {
  const firstCurly = text.indexOf('{');
  const firstSquare = text.indexOf('[');
  const startIndex =
    firstCurly === -1
      ? firstSquare
      : firstSquare === -1
        ? firstCurly
        : Math.min(firstCurly, firstSquare);
  const lastCurly = text.lastIndexOf('}');
  const lastSquare = text.lastIndexOf(']');
  const endIndex =
    lastCurly === -1 ? lastSquare : lastSquare === -1 ? lastCurly : Math.max(lastCurly, lastSquare);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No JSON object found in the text');
  }
  const jsonString = text.slice(startIndex, endIndex + 1);
  return jsonString;
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
