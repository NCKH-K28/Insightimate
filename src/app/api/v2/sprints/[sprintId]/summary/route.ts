import { sprintService } from '@/features/boards/server/sprint-service';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';

type Params = { sprintId: string };
export const GET = compose<Params>(async (req) => {
  const { sprintId } = req.params;
  const result = await sprintService.summary(sprintId);
  return NextResponse.json(result);
});
