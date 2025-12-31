// import { tool, generateObject } from 'ai';
// import { google } from '@ai-sdk/google';
// import z from 'zod';
// import { ZBoardIssueCreateInput } from '@/contracts/boards/boards.input';

// export const ZIssueInput = ZBoardIssueCreateInput;
// export type IssueInput = z.infer<typeof ZIssueInput>;

// const issueExample: IssueInput = {
//   summary: 'Implement user login API',
//   description: `As a user, I want to log in to the application using my email and password so that I can access my personalized dashboard.`,
//   typeId: 'story',
//   statusId: 'to_do',
//   priorityId: 'high',
//   storyPoints: 3,
//   assigneeId: null,
// };

// export const IssueGenInput = z.object({
//   feature: z.string().min(1, 'feature is required'),
//   context: z.object({
//     projectId: z.string(),
//     boardId: z.string().optional(),
//     sprintId: z.string().optional(),
//     statusId: z.string().optional(),
//     members: z.object({ userId: z.string(), summary: z.string() }),
//   }),

//   language: z.enum(['vi', 'en']).default('vi'),
// });

// export const IssueGenOutput = z.object({
//   summary: z.string(),
//   assumptions: z.array(z.string()).default([]),
//   issues: z.array(ZIssueInput).min(1),
// });

// export const IssueGenTool = tool({
//   name: 'IssueGen',
//   description:
//     'Generate a structured backlog (issues in JSON) for a feature/epic using AI with PM best practices (MoSCoW, AC, dependencies).',
//   inputSchema: IssueGenInput,
//   outputSchema: IssueGenOutput,
//   execute: async (input) => {
//     const { feature, context, language } = input;

//     const system = `You are a senior PM/Tech Lead helping to turn a feature request into an actionable backlog.
// - Output must strictly follow the provided Zod schema fields.
// - Use MoSCoW prioritization.
// - Provide concise titles, tight descriptions, and clear acceptance criteria (Gherkin-style when helpful).
// - Keep estimates realistic (story points); use null when unknown.
// - Respect context IDs when provided (projectId/sprintId/statusId).
// - Avoid hallucinating internal IDs beyond those passed in context.`;

//     const prompt = {
//       feature,
//       context,
//       constraints: undefined,
//       style: undefined,
//       language,
//       guidance: { examples: [issueExample] },
//     };

//     const { object } = await generateObject({
//       model: google('gemini-2.5-flash'),
//       schema: IssueGenOutput,
//       temperature: 0.2,
//       messages: [
//         { role: 'system', content: system },
//         {
//           role: 'user',
//           content: `Generate issues for the following input. Return only JSON matching the schema; do not include markdown.`,
//         },
//         { role: 'user', content: JSON.stringify(prompt) },
//       ],
//     });

//     return object;
//   },
// });
