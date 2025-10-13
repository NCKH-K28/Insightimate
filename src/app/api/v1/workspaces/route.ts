import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { init, createId as generateCuid2 } from '@paralleldrive/cuid2';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { get } from 'lodash';
import { ZWorkspaceCreateInput, ZWorkspaceListRes } from '@/contracts/workspaces';
import { cerbosEdge } from '@/lib/authz/cerbos';
import { workspaceActionEnum } from '@/contracts/auth';

const genWorkspaceId = init({ length: 10 });

export const GET = middlewareHandler([authenticated], async (request) => {
  const userId = get(request, 'auth.user.id', null);
  if (!userId) throw new Error('User ID not found in request auth');

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: { members: { where: { userId } } },
  });

  const wsWithPerms = workspaces.map(async (ws) => {
    const roles = ws.members.map((m) => m.role);
    if (roles.length === 0) return { ...ws, permissions: {} };

    const check = await cerbosEdge.checkResource({
      actions: Array.from(workspaceActionEnum),
      principal: { id: userId, roles, attributes: {} },
      resource: { kind: 'workspace', id: ws.id, attributes: { ownerId: ws.ownerId } },
    });

    const permissions = workspaceActionEnum.reduce(
      (acc, action) => ({ ...acc, [action]: check.isAllowed(action) ?? false }),
      {} as Record<string, boolean>,
    );

    return { ...ws, permissions };
  });

  const waited = await Promise.all(wsWithPerms);
  const data = ZWorkspaceListRes.parse({ data: waited, meta: {} });

  return NextResponse.json(data, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (request) => {
  const userId = get(request, 'auth.user.id', null);
  if (!userId) throw new Error('User ID not found in request auth');

  const body = await request.json();
  const valid = ZWorkspaceCreateInput.parse(body);

  const workspace = await prisma.workspace.create({
    data: {
      id: `wp_${genWorkspaceId()}`,
      name: valid.name,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: { create: { id: `wmem_${generateCuid2()}`, userId, role: 'ADMIN' } },
    },
  });

  const data = { ...workspace };

  return NextResponse.json(data, { status: 201 });
});
