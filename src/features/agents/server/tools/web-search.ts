import { RootSchema, serper } from '@/lib/serper';
import { tool } from 'ai';
import z from 'zod';

export const webSearch = tool({
  name: 'webSearch',
  description: 'Search the web for relevant information.',
  inputSchema: z.object({
    q: z.string().describe('The search query.'),
    page: z.number().optional().describe('The page number for paginated results, default is 1.'),
  }),
  outputSchema: RootSchema,
  execute: (input) => serper.search(input),
});
