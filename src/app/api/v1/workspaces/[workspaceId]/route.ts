import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import get from 'lodash/get';
import { ZWorkspaceItem } from '@/contracts/workspaces';
import { cerbosEdge } from '@/lib/authz/cerbos';
import { WorkspaceAction, workspaceActionEnum } from '@/contracts/auth';

export const GET = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, { params }) => {
    const userId = get(request, 'auth.user.id', null);
    if (!userId) throw new Error('User ID not found in request auth');
    const { workspaceId } = params;

    // load resource
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
    const members = await prisma.workspaceMember.findMany({ where: { workspaceId, userId } });
    const roles = members.map((m) => m.role);
    if (roles.length === 0) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    // === check permission ===

    const check = await cerbosEdge.checkResource({
      actions: Array.from(workspaceActionEnum),
      principal: { id: userId, roles, attributes: {} },
      resource: { kind: 'workspace', id: workspace.id, attributes: { ownerId: workspace.ownerId } },
    });

    const permissions = workspaceActionEnum.reduce(
      (acc, action) => ({ ...acc, [action]: check.isAllowed(action) ?? false }),
      {} as Record<string, boolean>,
    );

    if (!permissions.read) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const data = ZWorkspaceItem.parse({ ...workspace, permissions });
    return NextResponse.json(data, { status: 200 });
  },
);

export const DELETE = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, { params }) => {
    const userId = get(request, 'auth.user.id', null);
    if (!userId) throw new Error('User ID not found in request auth');
    const { workspaceId } = params;
    // load resource
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
    const members = await prisma.workspaceMember.findMany({ where: { workspaceId, userId } });
    const roles = members.map((m) => m.role);
    if (roles.length === 0) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    // === check permission ===

    const act: WorkspaceAction = 'delete';
    const check = await cerbosEdge.checkResource({
      actions: [act],
      principal: { id: userId, roles, attributes: {} },
      resource: { kind: 'workspace', id: workspace.id, attributes: { ownerId: workspace.ownerId } },
    });
    if (!check.isAllowed(act)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // delete related data
    await prisma.workspace.delete({ where: { id: workspaceId } });

    return NextResponse.json({ message: 'Workspace deleted' }, { status: 200 });
  },
);
