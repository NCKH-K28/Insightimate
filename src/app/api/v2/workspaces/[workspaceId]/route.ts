// app/api/v2/workspaces/[workspaceId]/route.ts

import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/authn/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/authn';
import { workspaceService } from '@/features/workspaces/server/service';

type Params = { workspaceId: string };
export const GET = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const result = await workspaceService.getById(
    params.workspaceId,
    { actorId },
    { include: { permissions: true } },
  );
  return NextResponse.json(result, { status: 200 });
});

export const PATCH = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const body = await req.json();

  const result = await workspaceService.updateById(
    params.workspaceId,
    body,
    { actorId },
    { include: { permissions: true } },
  );
  return NextResponse.json(result, { status: 200 });
});

export const DELETE = middlewareHandler<Params>([authenticated], async (req, { params }) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: params.workspaceId } });
  if (!workspace) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await prisma.workspace.delete({ where: { id: params.workspaceId } });
  return NextResponse.json({ message: 'Workspace deleted' }, { status: 200 });
});
