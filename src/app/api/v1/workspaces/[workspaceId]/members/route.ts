// import { httpExceptionFilter } from '@/lib/filters';
// import { authenticated } from '@/lib/guards';
// import { prisma } from '@/lib/prisma';
// import { NextRequest, NextResponse } from 'next/server';
// import get from 'lodash/get';

import { WorkspaceAction, workspaceActionEnum } from '@/contracts/auth';
import { ZWsMemberListRes } from '@/contracts/workspaces';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { cerbosEdge } from '@/lib/authz/cerbos';
import { prisma } from '@/lib/prisma';
import { get } from 'lodash';
import { NextResponse } from 'next/server';

// type Context = { params: Promise<{ workspaceId: string }> };
// export const GET = async (request: NextRequest, ctx: Context): Promise<NextResponse> => {
//   try {
//     const params = await ctx.params;
//     await authenticated(request, params);
//     await loadAttributes(request, params);

//     // const user = await getUserFromRequest(request);

//     const { workspaceId } = params;

//     const resource = get(request, 'resource', null);
//     const subject = get(request, 'subject', null);
//     if (!resource) throw new Error('Resource not found in request');
//     if (!subject) throw new Error('Subject not found in request');

//     // enforce throw
//     pdp.enforce({ action: WorkspaceActions.Read, subject, resource });

//     const members = await prisma.workspaceMember.findMany({
//       where: { workspaceId },
//       include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
//     });

//     const membersWithPer = members.map((member) => {
//       const permissions = pdp.getPermissions({
//         actions: Object.values(WorkspaceMemberActions),
//         subject,
//         resource: Object.assign({}, get(request, 'resource', {}), { member }),
//       });
//       return Object.assign(member, { permissions });
//     });

//     const data = { items: membersWithPer };

//     return NextResponse.json(data);
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// };

export const GET = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, ctx) => {
    const user = get(request, 'auth.user', null);
    if (!user) throw new Error('Missing "auth.user" in request');
    const userId = get(user, 'id', null);
    if (!userId) throw new Error('Missing "auth.user.id" in request');

    const { workspaceId } = ctx.params;
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { where: { userId } } },
    });
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    const userRoles = workspace.members.map((m) => m.role);
    if (userRoles.length === 0)
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 },
      );

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
    });
    const actions: WorkspaceAction[] = ['member:manage_admin', 'member:manage_member'];
    const membersWithPer = members.map(async (member) => {
      const check = await cerbosEdge.checkResource({
        actions: actions,
        principal: { id: userId, roles: ['nono'], attr: { workspaceRoles: userRoles } },
        resource: {
          kind: 'workspace',
          id: workspaceId,
          attr: { ownerId: workspace.ownerId, targetMemberRole: member.role },
        },
      });
      const permissions = workspaceActionEnum.reduce(
        (acc, action) => ({ ...acc, [action]: check.isAllowed(action) ?? false }),
        {} as Record<string, boolean>,
      );

      return Object.assign(member, { permissions });
    });

    const result = await Promise.all(membersWithPer);
    const data = ZWsMemberListRes.parse({ data: result, meta: {} });

    return NextResponse.json(data, { status: 200 });
  },
);
