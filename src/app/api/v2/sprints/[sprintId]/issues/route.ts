import { ZBoardIssueList } from '@/contracts/boards/boards.query';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { sprintId: string };
export const GET = compose<Params>(async (req) => {
  const { sprintId } = req.params;

  const boardIssues = await prisma.boardIssue.findMany({
    where: { sprintId },
    include: {
      issue: {
        include: { type: true, status: true, priority: true, assignee: true, reporter: true },
      },
    },
  });

  const issues = boardIssues.map(({ issue, ...rest }) => ({ ...issue, ...rest }));

  const result = ZBoardIssueList.parse({ data: issues, meta: {} });

  return NextResponse.json(result);
});
