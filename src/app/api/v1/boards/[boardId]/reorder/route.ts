import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionFilter } from '@/lib/http/filters';
import { boardIssueReorderSchema, boardReorderSchema } from '../../../../../../../.temp/schemas/board';
import { reorderBoardIssues } from '@/lib/services/old/board';

type Context = { params: Promise<{ boardId: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { params } = context;
    const { boardId } = await params;

    const body = await request.json();
    const input = boardReorderSchema.parse(body);
    if (input.source.parentType === 'sprint' || input.source.parentType === 'column') {
      const issueInput = boardIssueReorderSchema.parse(input);
      const result = await reorderBoardIssues({ boardId }, issueInput);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Reordering is only supported for issues in sprints or columns.' },
      { status: 400 },
    );
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
