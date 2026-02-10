import { ZProjectImportWithLogic } from '@/contracts/project';
import { importProject } from '@/features/projects/server/cqrs/c-project-import';
import { authenticatedV2, getAuthFromRequest } from '@/lib/authn';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { NextResponse } from 'next/server';

export const POST = compose<{ workspaceId: string }>(
  authenticatedV2,
  zodBodyPipe(ZProjectImportWithLogic),
  async (req) => {
    const auth = await getAuthFromRequest(req);
    const { workspaceId } = req.params;

    const input = getZodBody(req, ZProjectImportWithLogic);
    const result = await importProject({ data: input, workspaceId }, { actorId: auth.user.id });

    return NextResponse.json(result);
  },
);
