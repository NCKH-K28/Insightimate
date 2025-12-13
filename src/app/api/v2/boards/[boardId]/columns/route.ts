import { ZBoardColumnList } from '@/contracts/boards/boards.query';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { boardId: string };
export const GET = compose<Params>(async (req) => {
  const { boardId } = req.params;

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return new NextResponse('Board not found', { status: 404 });

  const columns = await prisma.boardColumn.findMany({
    where: { boardId },
    include: { statuses: { include: { status: true } } },
    orderBy: { sequence: 'asc' },
  });

  const mappedColumns = columns.map(({ statuses, ...col }) => ({
    statuses: statuses.map(({ status }) => status),
    ...col,
  }));

  const result = ZBoardColumnList.parse({ data: mappedColumns, meta: {} });
  return NextResponse.json(result);
});
