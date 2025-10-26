import { NextResponse } from 'next/server';
import { compose } from '@/lib/http/api-compose';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth';
import { sourceService } from '@/features/agents/server/services/source.service';
import z from 'zod';

const ZSourceParams = z.object({ agentId: z.string(), sourceId: z.string() });

export const DELETE = compose(authenticatedV2, async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const params = ZSourceParams.parse(req.params);
  const sourceId = params.sourceId;
  // log
  console.log(`Deleting source ${sourceId} by actor ${actorId}`);
  const result = await sourceService.remove(sourceId, { actorId });

  return NextResponse.json(result);
});
