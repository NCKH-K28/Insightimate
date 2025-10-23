import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/index.mjs';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createIssue',
      description:
        'Create a new issue in the project management system with the given summary and description. Returns the ID and key of the newly created issue.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['summary', 'description'],
      },
    },
  },
];
