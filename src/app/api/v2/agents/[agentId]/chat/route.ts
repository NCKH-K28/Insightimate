// import z from 'zod';
// import {
//   convertToModelMessages,
//   createUIMessageStream,
//   createUIMessageStreamResponse,
//   stepCountIs,
//   streamText,
//   tool,
// } from 'ai';
// import { google } from '@ai-sdk/google';
// import { middlewareHandler } from '@/lib/http/api-handler.v2';
// import { authenticated, getAuthFromRequest } from '@/lib/auth';
// import { buildPMSearchTool, webSearchTool } from '@/features/agents/server/tools';
// import {
//   issueGenerator,
//   ZIssueGenerationOutput,
// } from '@/features/agents/server/cqrs/c-issue-generator';
// // tools: {

// export const POST = middlewareHandler([authenticated], async (req) => {
//   const auth = await getAuthFromRequest(req);
//   const actorId = auth.user.id;

//   const body = await req.json();
//   const { messages = [], contexts } = body;

//   console.log('Insight Chat Request Body:', JSON.stringify(contexts, null, 2));

//   const issuesGeneratorTool = tool({
//     description: 'Generates issues based on the project description and requirements.',
//     inputSchema: z.object({
//       text: z.string().describe('A description of the feature to create issues for'),
//     }),
//     outputSchema: ZIssueGenerationOutput,
//     execute: (input) => issueGenerator(input, { actorId }),
//   });

//   const searchTools = buildPMSearchTool({ actorId });

//   const stream = createUIMessageStream({
//     async execute({ writer }) {
//       const result = streamText({
//         model: google('gemini-2.5-flash'),
//         system: `
// You are an AI assistant specialized in project management tasks. Use the provided tools to assist with project planning, issue generation, and information retrieval.
// Respond concisely and accurately based on the tool outputs.
// `.trim(),
//         messages: await convertToModelMessages(messages.slice(-8)),
//         //   ...searchTools,
//         //   current_context: tool({
//         //     description: 'Get the current contexts provided to the agent.',
//         //     inputSchema: z.object({}),
//         //     outputSchema: z.any(),
//         //     execute: async () => {
//         //       return { contexts, currentUserId: actorId };
//         //     },
//         //   }),
//         //   current_time: tool({
//         //     description: 'Get the current date and time in ISO 8601 format.',
//         //     inputSchema: z.object({}),
//         //     outputSchema: z.object({
//         //       currentTime: z.string().describe('The current date and time in ISO 8601 format'),
//         //       timezone: z.string().describe('The IANA timezone name, e.g., America/New_York'),
//         //     }),
//         //     execute: async () => {
//         //       return {
//         //         currentTime: new Date().toISOString(),
//         //         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         //       };
//         //     },
//         //   }),
//         //   web_search: webSearchTool,
//         //   issues_generator: issuesGeneratorTool,
//         // },
//         stopWhen: stepCountIs(50),
//       });

//       writer.merge(result.toUIMessageStream({ sendFinish: false }));
//       await result.consumeStream();
//     },
//   });

//   return createUIMessageStreamResponse({ stream });
// });
export {};
