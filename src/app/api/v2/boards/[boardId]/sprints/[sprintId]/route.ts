import { ZBoardSprintUpdateInput } from '@/contracts/boards/boards.input';
import { middlewareHandler } from '@/lib/http/api-handler';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

type SprintParams = { boardId: string; sprintId: string };

export const GET = middlewareHandler<SprintParams>([], async (req) => {
  const prams = req.params;
  const result = await boardsService.getSprintById(
    { boardId: prams.boardId, sprintId: prams.sprintId },
    { sum: { storyPoints: true }, count: { issues: true } },
  );
  return NextResponse.json(result);
});

export const PATCH = middlewareHandler<{ boardId: string; sprintId: string }>([], async (req) => {
  const prams = req.params;
  const body = await req.json();
  const input = ZBoardSprintUpdateInput.parse(body);
  const result = await boardsService.updateSprint(
    { boardId: prams.boardId, sprintId: prams.sprintId },
    input,
  );
  return NextResponse.json(result);
});

export const DELETE = middlewareHandler<{ boardId: string; sprintId: string }>([], async (req) => {
  const prams = req.params;
  await boardsService.deleteSprint({ boardId: prams.boardId, sprintId: prams.sprintId });
  return NextResponse.json({});
});
