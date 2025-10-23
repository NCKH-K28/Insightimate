import { middlewareHandler } from '@/lib/http/api-handler';
import { get } from 'lodash';
import { NextResponse } from 'next/server';
import { indexIssues, searchIssues } from '../server/indexer';
import { tools } from '../server/skills';
import { githubOpenAI } from '../server/openai';

export const GET = middlewareHandler([], async (req) => {
  const query = req.query;
  const prompt = get(query, 'prompt', '');
  const indexs = Boolean(get(query, 'indexs', false));

  if (prompt) {
    const mode: string = get(query, 'mode', '');
    const map: Record<string, 'auto' | 'none'> = { auto: 'auto', none: 'none' };

    const rest = await searchIssues(prompt as string, 'system');
    const contextText = rest
      .map((r, i) => `[#${i + 1} ${r.resourceType} ${r.resourceId} - Score: ${r.score.toFixed(4)}]`)
      .join('\n');

    const resp = await githubOpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý trong app quản lý công việc.
Chỉ dựa trên NGỮ CẢNH được cung cấp. Luôn trích dẫn [#id] khi trả lời.
Khi người dùng muốn hành động (tạo/cập nhật task), hãy gọi function tương ứng sau khi xác nhận đủ thông tin.`,
        },
        {
          role: 'system',
          content: `NGỮ CẢNH:\n${contextText || 'Không có ngữ cảnh phù hợp.'}`,
        },
        { role: 'user', content: prompt },
      ],
      tools: tools,
      tool_choice: map[mode] ?? 'none',
      temperature: 0.2,
    });

    const call = resp.choices[0].message.tool_calls?.[0];
    if (call) console.log('Tool call:', call);

    const answer = resp.choices[0].message.content;
    return NextResponse.json({ answer });
  }

  // if (indexs) {
  //   const result = await indexIssues();
  //   return NextResponse.json({ message: 'Indexing completed', result });
  // }

  return NextResponse.json({ message: 'Hello from NL2 API' });
});
