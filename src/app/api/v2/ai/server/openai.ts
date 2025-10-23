import type { JSONSchema7 } from 'json-schema';
import OpenAI from 'openai';

const token = process.env['COPILOT_API_KEY'];
const endpoint = 'https://models.github.ai/inference';
const model = 'openai/gpt-4.1-mini';
export const githubOpenAI = new OpenAI({ baseURL: endpoint, apiKey: token });

type Tool = OpenAI.Responses.Tool;
const NL2Tools: Tool[] = [
  {
    type: 'function',
    name: 'code_interpreter',
    description: 'A tool to perform calculations and create plots using Python code.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt describing the calculation or plot to create.',
        },
      },
    },
  },
];
