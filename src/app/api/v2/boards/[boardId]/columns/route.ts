import { ZColumnCreateInput } from '@/contracts/boards/boards.input';
import { ZBoardColumnItem, ZBoardColumnList } from '@/contracts/boards/boards.query';
import {
  genColumnId,
  genColumnStatusId,
  genIssueStatusId,
} from '@/features/projects/configs/id-generators';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
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

export const POST = compose<{ boardId: string }>(zodBodyPipe(ZColumnCreateInput), async (req) => {
  const { boardId } = req.params;
  const input = getZodBody(req, ZColumnCreateInput);

  const result = await prisma.$transaction(async (tx) => {
    const board = await tx.board.findUnique({ where: { id: boardId }, include: { project: true } });
    if (!board) throw new NextResponse('Board not found', { status: 404 });
    if (!board.project.id) throw new NextResponse('Project not found', { status: 404 });
    const columns = await tx.boardColumn.findMany({ where: { boardId } });
    const maxSequence = columns.reduce((max, col) => Math.max(max, col.sequence), 0);

    // create default statuses
    const projectId = board.project.id;
    const maxSequenceStatus = await tx.issueStatus.findFirst({
      where: { projectId },
      orderBy: { sequence: 'desc' },
    });

    const statuses = input.statuses.map((status, idx) => ({
      id: genIssueStatusId(),
      projectId,
      name: status.name,
      category: status.category,
      sequence: maxSequenceStatus ? maxSequenceStatus.sequence + idx + 1 : idx + 1,
    }));

    await tx.issueStatus.createMany({ data: statuses });

    const columnId = genColumnId();
    const colStes = statuses.map((status) => ({ id: genColumnStatusId(), statusId: status.id }));
    await tx.boardColumn.create({
      data: {
        id: columnId,
        boardId,
        name: input.name,
        sequence: maxSequence + 1,
        statuses: { createMany: { data: colStes } },
      },
    });

    const newColumn = await tx.boardColumn.findUniqueOrThrow({
      where: { id: columnId },
      include: { statuses: { include: { status: true } } },
    });

    return ZBoardColumnItem.parse({
      ...newColumn,
      statuses: newColumn.statuses.map((s) => s.status),
    });
  });

  return NextResponse.json(result);
});
