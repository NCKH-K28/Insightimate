import { ModelMessage, streamObject, FilePart } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import aiStorage from '@/lib/minio/ai-storage';
import { ZProjectImport } from '@/contracts/projects';
import { ZJsonPatchOp } from '@/lib/jsonpatch';

export const getFilePart = async (key: string): Promise<FilePart> => {
  const meta = await aiStorage.head(key);
  const downloadURL = await aiStorage.getDownloadURL(key);
  const mediaType = meta.ContentType || 'application/octet-stream';
  return { type: 'file', mediaType, data: downloadURL };
};

const ZContext = z.object({
  type: z.enum(['file', 'text']),
  value: z.string(),
  label: z.string(),
});
const ZGenerateInput = z.object({
  values: ZProjectImport.partial().optional(),
  instruction: z.string().optional(),
  contexts: z.array(ZContext).optional(),
});

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const parsedInput = ZGenerateInput.parse(body ?? {});
  const { values, instruction, contexts = [] } = parsedInput;

  if (values?.issues) {
    values.issues = values.issues.map((iss, __index) => ({ ...iss, __index }));
  }

  const fileContexts = contexts.filter((c) => c.type === 'file');
  const promiseFileParts = fileContexts.map(({ value }) => getFilePart(value));
  const fileParts = await Promise.all(promiseFileParts);

  const prompts: ModelMessage[] = [];

  if (values) {
    prompts.push({
      role: 'assistant',
      content: `Current project data: ${JSON.stringify(values)}`,
    });
  }

  if (fileParts.length > 0) prompts.push({ role: 'user', content: fileParts });
  if (instruction) prompts.push({ role: 'user', content: instruction });

  // == Provide project schema ==
  const projectJSONSchema = z.toJSONSchema(ZProjectImport);
  const schemaText = JSON.stringify(projectJSONSchema);

  const result = streamObject({
    model: google('gemini-2.5-flash'),
    output: 'array',
    schema: ZJsonPatchOp,
    temperature: 0.25,
    prompt: prompts,
    system: `
    You are an AI assistant that helps users generate and modify project management data structures. Given the current project data and an instruction, you will output a series of JSON Patch operations to modify the project accordingly. Follow the JSON Patch standard (RFC 6902) and use the provided schema for valid operations.
    Mapping fields:
    - tasks -> issues
    - title (name) -> summary
  
    Ensure all operations conform to the following JSON Schema for project data:
    ${schemaText}
    `.trim(),
  });

  return result.toTextStreamResponse();
};
