import { NextResponse } from 'next/server';
import { compose } from '@/lib/http/api-compose';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { issueGenerator } from '@/features/agents/server/cqrs/c-issue-genarator';

const mockInput = `Tạo danh sách công việc cho tính năng login (đăng nhập) bao gồm xác thực mật khẩu và xác thực hai yếu tố.`;

export const GET = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const query = req.query;
  const userInput: string = query['prompt'] || mockInput;

  try {
    const result = await issueGenerator({ text: userInput }, { actorId });

    return NextResponse.json({
      message: 'Agent test endpoint is working!',
      data: result,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
});
