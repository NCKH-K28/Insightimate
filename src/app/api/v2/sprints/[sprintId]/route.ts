import { ZSprintItem } from '@/contracts/boards/boards.query';
import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Params = { sprintId: string };

export const GET = compose<Params>(async (req) => {
  const { sprintId } = req.params;

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { board: { include: { project: true } } },
  });

  if (!sprint) throw new Response('Sprint not found', { status: 404 });

  const projectId = sprint.board.projectId;

  const result = ZSprintItem.parse({ ...sprint, projectId });

  return NextResponse.json(result);
});
