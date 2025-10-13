import { ProjectAction } from '@/contracts/auth';
import { ZProjectCreateInput, ZProjectListRes, ZProjectRole } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { cerbosEdge } from '@/lib/authz/cerbos';
import { prisma } from '@/lib/prisma';
import createProject from '@/lib/services/project/c-project-create';
import { get } from 'lodash';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, { params }) => {
    const auth = await getAuthFromRequest(request);
    const userId = auth.user.id;
    const { workspaceId } = params;

    // -- load subject & resource attributes
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        OR: [{ leadId: userId }, { actors: { some: { actorType: 'USER', actorId: userId } } }],
      },
      include: {
        board: { select: { id: true } },
        lead: { select: { id: true, name: true, email: true, avatar: true } },
        actors: { where: { actorType: 'USER', actorId: userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const actions: ProjectAction[] = ['read', 'manage'];

    const formatted = projects.map((p) => ({
      ...p,
      boardId: p.board?.id,
      roles: p.actors
        .map((a) => a.role)
        .filter((r) => r !== null && r !== undefined)
        .map((r) => ZProjectRole.parse(r)),
    }));

    const projectsWithPerms = formatted.map(async (project) => {
      const check = await cerbosEdge.checkResource({
        actions,
        principal: { id: userId, roles: ['none'] },
        resource: {
          kind: 'project',
          id: project.id,
          attributes: { workspaceId, ownerId: workspace.ownerId },
        },
      });

      const permissions = actions.reduce(
        (acc, action) => ({ ...acc, [action]: check.isAllowed(action) ?? false }),
        {} as Record<string, boolean>,
      );

      return { ...project, permissions };
    });
    const waited = await Promise.all(projectsWithPerms);

    const data = ZProjectListRes.parse({
      data: waited,
      meta: {},
    });

    return NextResponse.json(data, { status: 200 });
  },
);

export const POST = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, { params }) => {
    const user = get(request, 'auth.user', null);
    if (!user) throw new Error('Missing user in request');
    const userId = get(user, 'id', null);
    if (!userId) throw new Error('Missing user id in request');

    const { workspaceId } = params;

    const body = await request.json();
    const input = ZProjectCreateInput.parse({ ...body, ...params, leadId: userId });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });

    const members = await prisma.workspaceMember.findMany({ where: { workspaceId, userId } });
    if (members.length === 0) {
      return NextResponse.json(
        { message: 'You are not a member of this workspace' },
        { status: 403 },
      );
    }

    const project = await createProject({ userId, template: 'SCRUM' }, input);
    return NextResponse.json({ data: project }, { status: 201 });
  },
);

// export const GET = apiHandler<{ workspaceId: string }>(async (request, ctx) => {
//   // ============== Infrastructure Layer
//   const query = request.query;
//   const params = ctx.params;

//   const auth = await authenticated(request, params);
//   await loadAttributes(request, params);
//   const user = auth.user;

//   // Check workspace existence
//   const subject = get(request, 'subject', {});
//   const resource = get(request, 'resource', {});
//   pdp.enforce({ action: WorkspaceActions.ProjectList, subject, resource });
//   //=======

//   // ============== Application Layer
//   const { workspaceId } = params;

//   const where: Prisma.ProjectWhereInput = {
//     workspaceId,
//     OR: [{ leadId: user.id }, { actors: { some: { actorType: 'USER', actorId: user.id } } }],
//   };

//   const projects = await prisma.project.findMany({
//     where,
//     include: {
//       board: { select: { id: true } },
//       lead: { select: { id: true, name: true, email: true, avatar: true } },
//     },
//     orderBy: { createdAt: 'desc' },
//   });

//   const data = {
//     items: projects,
//   };

//   return NextResponse.json(data, { status: 200 });
// });

// type Context = { params: Promise<{ workspaceId: string }> };
// export async function GET(request: NextRequest, ctx: Context) {
//   try {
//     await authenticated(request, await ctx.params);
//     await loadAttributes(request, await ctx.params);

//     const user = await getUserFromRequest(request);

//     // Check workspace existence
//     const { workspaceId } = await ctx.params;
//     const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
//     if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
//     pdp.enforce({ action: ProjectActionEnums.Read, subject: { user }, resource: { workspace } });

//     // Parse and validate query params
//     const queryParams = parseQueryParams(request);
//     const input = projectQueryParamsSchema.parse(queryParams);
//     const result = await listProjects({ user, workspaceId }, input);

//     return NextResponse.json({ data: result }, { status: 200 });
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// }

// export async function POST(request: NextRequest, ctx: Context) {
//   try {
//     await authenticated(request, await ctx.params);
//     await userRolesGuard(request, await ctx.params);
//     const user = await getUserFromRequest(request);

//     const { workspaceId } = await ctx.params;
//     const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
//     if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });

//     pdp.enforce({ action: ProjectActionEnums.Create, subject: { user }, resource: { workspace } });

//     const body = await request.json();
//     const valid = projectCreateSchema.parse({ ...body, workspaceId });
//     const result = await createProject({ userId: user.id, template: 'SCRUM' }, valid);

//     return NextResponse.json({ data: result }, { status: 201 });
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// }

// export const POST = apiHandler<{ workspaceId: string }>(
//   async (request: NextRequest, { params }) => {
//     const auth = await authenticated(request, params);
//     await userRolesGuard(request, params);
//     await loadAttributes(request, params);
//     const user = auth.user;

//     const subject = get(request, 'subject', {});
//     const resource = get(request, 'resource', {});
//     pdp.enforce({ action: 'workspace.project:create', subject, resource });

//     const body = await request.json();
//     const input = ZProjectCreateInput.parse({ ...body, ...params });
//     const result = await createProject({ userId: user.id, template: 'SCRUM' }, input);

//     return NextResponse.json({ data: result }, { status: 201 });
//   },
// );
