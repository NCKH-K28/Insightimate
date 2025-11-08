import { z } from 'zod';
import { tool, generateObject } from 'ai';
import { google } from '@ai-sdk/google';

// --- App-side (final) schema: keeps your preferred types
const ZTypeHierarchyApp = z.union([
  z.literal(1).describe('Epic'),
  z.literal(0).describe('Story/Task'),
  z.literal(-1).describe('Sub-task'),
]);

// Prefer plain string with regex for dates in LLM schema; app can keep iso date if you like
const ZIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('YYYY-MM-DD');

export const ZIssueGenSchema = z.object({
  id: z.string().min(1).describe('e.g., PROJ-123'),
  summary: z.string().min(1).describe('A concise title for the issue'),
  description: z.string().optional(),
  dueDate: ZIsoDate.optional(),
  priority: z.number().min(1).max(5).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  type: z.object({
    name: z.string().min(1),
    hierarchy: ZTypeHierarchyApp,
  }),
  parentId: z.string().min(1).optional(),
  // Your prompt says "use null when unknown", so allow null
  storyPoints: z.number().min(0).nullable().optional(),
});

export const ZIssueGenOutput = z.object({ data: z.array(ZIssueGenSchema) });
export type IssueGenOutput = z.infer<typeof ZIssueGenOutput>;

// --- LLM-safe schema (NO transforms/refines); strings only where needed
const ZTypeHierarchyLLM = z
  .enum(['1', '0', '-1'])
  .describe('"1"=Epic, "0"=Story/Task, "-1"=Sub-task');

const ZIssueGenSchemaLLM = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  priority: z.number().min(1).max(5).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  type: z.object({
    name: z.string().min(1),
    hierarchy: ZTypeHierarchyLLM,
  }),
  parentId: z.string().min(1).optional(),
  storyPoints: z.number().min(0).nullable().optional(),
});

const ZIssueGenOutputLLM = z.object({ data: z.array(ZIssueGenSchemaLLM) });
type IssueGenOutputLLM = z.infer<typeof ZIssueGenOutputLLM>;

// Map LLM-safe -> App schema
function toApp(o: IssueGenOutputLLM): IssueGenOutput {
  return {
    data: o.data.map((it) => ({
      ...it,
      type: {
        ...it.type,
        hierarchy: it.type.hierarchy === '1' ? 1 : it.type.hierarchy === '0' ? 0 : -1,
      },
      // dueDate already matches YYYY-MM-DD
    })),
  };
}

// Example must match the LLM schema (hierarchy as string)
const issueExampleLLM: IssueGenOutputLLM['data'][number] = {
  id: 'PROJ-123',
  summary: 'Implement user login API',
  description: 'As a user, I want to log in using email and password so I can access my dashboard.',
  dueDate: undefined,
  priority: 3,
  status: 'TODO',
  type: { name: 'epic', hierarchy: '1' },
  parentId: undefined,
  storyPoints: 3,
};

export const ZIssueGenInput = z.object({
  feature: z.string().min(1),
  context: z.string().optional(),
  language: z.enum(['vi', 'en']).default('vi'),
});

export const ZIssueGenOutputType = ZIssueGenOutput; // re-export if needed

export const IssueGenTool = () => {
  return tool({
    name: 'IssueGen',
    description:
      'Generate a structured backlog (issues in JSON) for a feature/epic using AI with PM best practices (MoSCoW, AC, dependencies).',
    inputSchema: ZIssueGenInput,
    outputSchema: ZIssueGenOutput, // <- what your tool returns to callers
    execute: async (input) => {
      try {
        const { feature, context, language } = input;

        const system = `You are a senior PM/Tech Lead helping to turn a feature request into an actionable backlog.
- Output must strictly follow the provided Zod schema fields.
- Use MoSCoW prioritization.
- Provide concise titles, tight descriptions, and clear acceptance criteria (Gherkin-style when helpful).
- Keep estimates realistic (story points); use null when unknown.
- Respect context IDs when provided (projectId/sprintId/statusId).
- Avoid hallucinating internal IDs beyond those passed in context.`;

        const prompt = {
          feature,
          context,
          constraints: undefined,
          style: undefined,
          language,
          guidance: { examples: [issueExampleLLM] }, // match LLM schema
        };

        // 1) Ask Gemini to produce the LLM-safe shape (no transforms)
        const { object: llmObject } = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: ZIssueGenOutputLLM,
          temperature: 0.2,
          system,
          messages: [{ role: 'user', content: JSON.stringify(prompt) }],
        });

        // 2) Convert to your app shape and validate
        const appObject = ZIssueGenOutput.parse(toApp(llmObject));
        return appObject;
      } catch (error) {
        console.error('IssueGenTool execution error:', error);
        throw new Error('Failed to generate issues');
      }
    },
  });
};
