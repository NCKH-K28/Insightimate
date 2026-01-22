import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { middlewareHandler } from '@/lib/http/api-handler.v2';
import { authenticated } from '@/lib/authn';

export const GET = middlewareHandler([authenticated], async (req) => {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return Response.json({ error: 'Missing workspaceId' }, { status: 400 });
  }

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      suggestions: z.array(z.string()).describe('A list of 4 short, concise questions.'),
    }),
    system: `
      You are an expert Agile Project Management Assistant.
      Generate 4 short, relevant, and diverse follow-up questions or initial prompts for a user working in a project management workspace.
      The questions should be natural, professional, and helpful for a Product Owner or Developer.
      Examples:
      - "Tóm tắt tình hình sprint này"
      - "Danh sách bugs ưu tiên cao"
      - "Tiến độ dự án thế nào?"
      - "Các issues đang assign cho tôi"
      
      Generate in Vietnamese.
      Keep them under 10 words each.
    `,
    prompt: `Generate 4 suggestions for workspace ${workspaceId}.`,
  });

  return Response.json(object);
});
