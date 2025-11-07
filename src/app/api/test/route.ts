import { NextResponse } from 'next/server';
import { compose } from '@/lib/http/api-compose';
import { elasticClient } from '@/lib/elastic';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { hfClient } from '@/lib/huggingface';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
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

const ZIssueGenerationOutput = z.object({
  version: z.literal('1.0'),
  data: z.array(ZIssueDraft),
});
type IssueGenerationOutput = z.infer<typeof ZIssueGenerationOutput>;
const ZIssueGenerationOutputJSON = z.toJSONSchema(ZIssueGenerationOutput);

type IssueContext = z.infer<typeof ZIssueContext>;

const exampleOutput: IssueGenerationOutput = {
  version: '1.0',
  data: [
    {
      id: 'ISSUE-123',
      summary: 'Implement user authentication',
      description: 'Develop a secure user authentication system using JWT tokens.',
      story_points: 5,
      parent_id: null,
      due_date: '2024-07-15T00:00:00Z',
      priority: 'High',
    },
  ],
};

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
  // nếu chưa bật vector search thì dùng multi_match
  const res = await elasticClient.search({
    index: 'issues',
    query: { match_all: {} },
  });

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

const extractJson = (text: string): string => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return JSON');
  return text.slice(start, end + 1);
};

const callIssueLLM = async (prompt: string, context: { actorId: string }): Promise<string> => {
  const relatedIssues = await retrieveRelatedIssues({ text: prompt }, context);

  const payload = {
    user_input: prompt,
    context: { relatedIssues },
    output_schema: ZIssueGenerationOutputJSON,
    example_output: exampleOutput,
  };

  const systemPrompt = `
You are an AI agent that assists with software project management.

GOAL
- From a user request (often short or high-level), generate a structured list of project issues/tasks.
- Each issue must follow the provided JSON schema.
- Use the related issues context to avoid trùng lặp, để suy ra phụ thuộc, và để tái sử dụng mô tả/chuẩn đặt tên.

CONTEXT YOU RECEIVE
You will receive a JSON object with:
- user_input: the original user request in Vietnamese or English.
- context: {
    relatedIssues: [ ... ]   // array of existing issues from the project
  }
- output_schema: JSON schema you MUST follow.
- example_output: an example of a valid output.

WHAT YOU MUST DO
1. Read user_input and xác định mục tiêu: tính năng gì, phạm vi nào.
2. Nhìn vào context.relatedIssues để:
   - tránh tạo issue đã tồn tại,
   - gợi ý parent_id hợp lý nếu thấy issue cha tương ứng,
   - giữ cùng phong cách summary/description.
3. Bẻ nhỏ công việc thành các issue có thể giao cho dev, QA hoặc PM.
4. Điền đủ các field theo schema:
   - id: tạo mã tạm thời kiểu "ISSUE-LOGIN-1" hoặc "ISSUE-AUTH-1" (duy nhất trong output).
   - summary: ngắn, mô tả hành động, tiếng Anh hoặc tiếng Việt tùy theo user_input, ưu tiên cùng ngôn ngữ với user_input.
   - description: mô tả rõ mục đích, phạm vi, acceptance criteria nếu suy ra được.
   - story_points: số nguyên nhỏ (1–8) nếu suy được; nếu không để null.
   - parent_id: nếu thấy trong relatedIssues có issue cha phù hợp thì gán id đó, nếu không thì để null.
   - due_date: nếu không được chỉ định rõ, hãy để null.
   - priority: chọn trong ['Very Low', 'Low', 'Medium', 'High', 'Very High'] dựa trên mức độ quan trọng của tính năng; các yêu cầu bảo mật, xác thực, thanh toán, và blocker nên là 'High' hoặc 'Very High'.

OUTPUT RULES (IMPORTANT)
- Return ONLY valid JSON that matches output_schema.
- Do NOT add explanations, markdown, or extra text.
- Do NOT wrap JSON in code fences.
- Do NOT invent fields that are not in the schema.
- If something is missing in the user request (e.g. due date), set that field to null.

PRIORITIZATION LOGIC
- If the request is about authentication, payments, or cross-cutting security: priority = 'High' or 'Very High'.
- If the issue is clearly a subtask (UI, validation, tests) of a bigger feature: priority = 'Medium'.
- If it is documentation or improvement: 'Low'.

LANGUAGE
- Mirror the language of user_input in summary/description.
- Keep field names in English exactly as in schema.

Your final answer must be a JSON object exactly like example_output, but adapted to the user_input and context.
  `.trim();

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    prompt: JSON.stringify(payload),
  });

  return text;
};

export const GET = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const { searchParams } = new URL(req.url);
  const userInput =
    searchParams.get('q') ??
    'Tạo danh sách công việc cho tính năng login (đăng nhập) bao gồm xác thực mật khẩu và xác thực hai yếu tố.';

  try {
    const raw = await callIssueLLM(userInput, { actorId });
    const json = extractJson(raw);
    const parsed = ZIssueGenerationOutput.safeParse(JSON.parse(json));

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'LLM output invalid', issues: parsed.error.format() },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: 'Agent test endpoint is working!',
      data: parsed.data,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
});
