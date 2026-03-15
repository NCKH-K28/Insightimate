import { Hono } from 'hono';
import { authenticatedGuard, getUserAndThrow } from '@/lib/auth';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  ZProjectCreateInput,
  ZProjectUpdateInput,
  ZProjectActorAddInput,
  ZProjectActorUpdateInput,
  ZProjectRoleCreateInput,
} from '@/contracts/project';
import { projectsService } from '@/features/project_v3/server/projects.service';
import { actorsService } from '@/features/project_v3/server/actors.service';
import { rolesService } from '@/features/project_v3/server/roles.service';
import { exportService } from '@/features/project_v3/server/export.service';
import { searchProjects, ZProjectListInput } from '@/features/project/server/cqrs/search-projects';
import { prisma } from '@/lib/prisma';

const projsHono = new Hono().basePath('/api/v3/projs');
projsHono.use(authenticatedGuard);
projsHono.onError(httpExceptionFilterHono);

// ========================== PROJECT CRUD APIs ==========================

// GET /api/v3/projs - List projects
const ZListProjectsQuery = z.object({
  orgId: z.string().optional(),
  includePermissions: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

projsHono.get('/', zValidator('query', ZListProjectsQuery), async (c) => {
  const auth = await getUserAndThrow(c);
  const { orgId, includePermissions } = c.req.valid('query');
  const result = await projectsService.list(
    { filter: { orgId } },
    { actorId: auth.id },
    { include: { permissions: includePermissions } },
  );
  return c.json(result);
});

// POST /api/v3/projs - Create project
projsHono.post('/', zValidator('json', ZProjectCreateInput), async (c) => {
  const auth = await getUserAndThrow(c);
  const input = c.req.valid('json');
  const result = await projectsService.create(input, { actorId: auth.id });
  return c.json(result);
});

// ========================== FACETS API ==========================

// GET /api/v3/projs/facets - Get project facets
const ZFacetsQuery = z.object({ orgId: z.string().optional() });

projsHono.get('/facets', zValidator('query', ZFacetsQuery), async (c) => {
  const auth = await getUserAndThrow(c);
  const { orgId } = c.req.valid('query');
  const result = await projectsService.getFacets({ filter: { orgId } }, { actorId: auth.id });
  return c.json(result);
});

// ========================== SEARCH API ==========================

// GET /api/v3/projs/search - Search projects
const ZSearchQuery = z.object({
  q: z.string().optional(),
  workspaceId: z.string().optional(),
});

projsHono.get('/search', zValidator('query', ZSearchQuery), async (c) => {
  const auth = await getUserAndThrow(c);
  const query = c.req.valid('query');
  const input = ZProjectListInput.parse({ filter: query });
  const result = await searchProjects(input, { actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/projs/favorites - List user's favorite projects
projsHono.get('/favorites', async (c) => {
  const auth = await getUserAndThrow(c);
  const result = await projectsService.listFavorites({ actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/projs/:projId - Get project by ID
projsHono.get('/:projId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.getById(projId, { actorId: auth.id });
  return c.json(result);
});

// PATCH /api/v3/projs/:projId - Update project
projsHono.patch('/:projId', zValidator('json', ZProjectUpdateInput), async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const input = c.req.valid('json');
  const result = await projectsService.update(projId, input, { actorId: auth.id });
  return c.json(result);
});

// DELETE /api/v3/projs/:projId - Delete project
projsHono.delete('/:projId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.delete(projId, { actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/projs/:projId/summary - Project summary stats
projsHono.get('/:projId/summary', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();

  // Authorization: ensure caller can read the project
  const project = await projectsService.getById(projId, { actorId: auth.id });

  const projectId = project.id;

  const totalIssues = await prisma.issue.count({ where: { projectId } });

  const statusCounts = await prisma.issue.groupBy({
    by: ['statusId'],
    where: { projectId },
    _count: { _all: true },
  });

  const statuses = await prisma.issueStatus.findMany({
    where: { projectId },
    select: { id: true, name: true, color: true, sequence: true, category: true },
    orderBy: { sequence: 'asc' },
  });

  const categoryCounts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

  const statusData = statuses.map((s) => {
    const grp = statusCounts.find((g) => g.statusId === s.id);
    const count = grp?._count?._all ?? 0;
    if (s.category && Object.prototype.hasOwnProperty.call(categoryCounts, s.category)) {
      categoryCounts[s.category] += count;
    }
    return { status: s.id, label: s.name, value: count, fill: s.color || null };
  });

  const priorityCounts = await prisma.issue.groupBy({
    by: ['priorityId'],
    where: { projectId },
    _count: { _all: true },
  });

  const priorities = await prisma.issuePriority.findMany({
    where: { projectId },
    select: { id: true, name: true, iconURL: true, sequence: true },
    orderBy: { sequence: 'asc' },
  });

  const priorityData = priorities.map((p) => {
    const grp = priorityCounts.find((g) => g.priorityId === p.id);
    return {
      priority: p.id,
      label: p.name,
      value: grp?._count?._all ?? 0,
      icon: p.iconURL ?? null,
    };
  });

  const leadObj = project.leadId
    ? await prisma.user.findUnique({
        where: { id: project.leadId },
        select: { id: true, name: true, email: true },
      })
    : null;

  const projectOverview = {
    workspace: null,
    lead: leadObj ? (leadObj.name ?? leadObj.email ?? null) : null,
    startDate: project.createdAt ?? null,
    version: null,
  };

  const [backlog, bugs, activeSprints] = await Promise.all([
    prisma.issue.count({ where: { projectId, archived: false } }),
    prisma.issue.count({
      where: { projectId, type: { name: { equals: 'Bug', mode: 'insensitive' } } },
    }),
    prisma.sprint.count({ where: { board: { projectId }, state: 'ACTIVE' } }),
  ]);

  return c.json({
    totalIssues,
    todo: categoryCounts.TODO,
    inProgress: categoryCounts.IN_PROGRESS,
    done: categoryCounts.DONE,
    statusData,
    priorityData,
    quickStats: { backlog, bugs, activeSprints },
    projectOverview,
  });
});

// GET /api/v3/projs/:projId/export - Export project data
projsHono.get('/:projId/export', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();

  const result = await exportService.exportProject(projId, { actorId: auth.id });

  const filename = `project-${result.project.key || result.project.id}-export.json`;
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.json(result);
});

// ========================== PROJECT ACTORS APIs ==========================

// GET /api/v3/projs/:projId/actors - List actors in project
projsHono.get('/:projId/actors', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();

  // Authorization: Ensure caller has access to the project before listing actors
  await projectsService.getById(projId, { actorId: auth.id });

  const result = await actorsService.listProjectActors({ projectId: projId });
  return c.json(result);
});

// POST /api/v3/projs/:projId/actors - Add actor to project
projsHono.post(
  '/:projId/actors',
  zValidator('json', ZProjectActorAddInput.omit({ projectId: true })),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { projId } = c.req.param();
    const input = c.req.valid('json');
    const result = await actorsService.addProjectActor(
      { ...input, projectId: projId },
      { actorId: auth.id },
    );
    return c.json(result);
  },
);

// PATCH /api/v3/projs/:projId/actors/:actorId - Update actor in project
projsHono.patch(
  '/:projId/actors/:actorId',
  zValidator('json', ZProjectActorUpdateInput.omit({ id: true })),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { projId, actorId } = c.req.param();
    const input = c.req.valid('json');
    const result = await actorsService.updateProjectActor(
      { projectId: projId, actorId, ...input },
      { actorId: auth.id },
    );
    return c.json(result);
  },
);

// DELETE /api/v3/projs/:projId/actors/:actorId - Remove actor from project
projsHono.delete('/:projId/actors/:actorId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId, actorId } = c.req.param();
  const result = await actorsService.removeProjectActor(
    { projectId: projId, actorId },
    { actorId: auth.id },
  );
  return c.json(result);
});

// ========================== PROJECT ROLES APIs ==========================

// GET /api/v3/projs/:projId/roles - List roles in project
projsHono.get('/:projId/roles', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await rolesService.listProjectRoles(projId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/projs/:projId/roles - Create role in project
projsHono.post(
  '/:projId/roles',
  zValidator('json', ZProjectRoleCreateInput.omit({ projectId: true })),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { projId } = c.req.param();
    const input = c.req.valid('json');
    const result = await rolesService.createProjectRole(
      { ...input, projectId: projId },
      { actorId: auth.id },
    );
    return c.json(result);
  },
);

// GET /api/v3/projs/:projId/roles/:roleId - Get role by ID
projsHono.get('/:projId/roles/:roleId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { roleId } = c.req.param();
  const result = await rolesService.getProjectRoleById(roleId, { actorId: auth.id });
  return c.json(result);
});

// DELETE /api/v3/projs/:projId/roles/:roleId - Delete role
projsHono.delete('/:projId/roles/:roleId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { roleId } = c.req.param();
  const result = await rolesService.deleteProjectRole(roleId, { actorId: auth.id });
  return c.json(result);
});

// ========================== PROJECT ISSUE STATUSES APIs ==========================

// GET /api/v3/projs/:projId/issue-statuses - List issue statuses
projsHono.get('/:projId/issue-statuses', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.listStatuses(projId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/projs/:projId/issue-statuses - Create issue status
projsHono.post('/:projId/issue-statuses', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const input = await c.req.json();
  const result = await projectsService.createStatus(projId, input, { actorId: auth.id });
  return c.json(result, 201);
});

// DELETE /api/v3/projs/:projId/issue-statuses - Delete issue status
projsHono.delete('/:projId/issue-statuses', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const statusId = c.req.query('statusId');
  if (!statusId) {
    return c.json({ error: 'Status ID is required' }, 400);
  }
  const result = await projectsService.deleteStatus(projId, statusId, { actorId: auth.id });
  return c.json(result);
});

// ========================== PROJECT MEMBERS APIs ==========================

// GET /api/v3/projs/:projId/members - List members in project
projsHono.get('/:projId/members', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();

  // Auth check: ensure caller has access to project
  await projectsService.getById(projId, { actorId: auth.id });

  // Get actors with their resolved user/team data
  const actors = await actorsService.listProjectActors({ projectId: projId });

  // Also resolve actual user members (including team members)
  const userIds = actors.data.filter((a) => a.actorType === 'USER').map((a) => a.actorId);
  const teamIds = actors.data.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);

  const teamMembers = teamIds.length > 0
    ? await prisma.teamMember.findMany({ where: { teamId: { in: teamIds } } })
    : [];
  const teamMemberUserIds = teamMembers.map((tm) => tm.userId);

  const allUserIds = Array.from(new Set([...userIds, ...teamMemberUserIds]));
  const users = allUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, email: true, avatar: true },
      })
    : [];

  return c.json({ actors: actors.data, members: users });
});

// POST /api/v3/projs/:projId/members - Add member to project
projsHono.post(
  '/:projId/members',
  zValidator('json', ZProjectActorAddInput.omit({ projectId: true })),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { projId } = c.req.param();
    const input = c.req.valid('json');
    const result = await actorsService.addProjectActor(
      { ...input, projectId: projId },
      { actorId: auth.id },
    );
    return c.json(result, 201);
  },
);

// PATCH /api/v3/projs/:projId/members/:memberId - Update member in project
projsHono.patch(
  '/:projId/members/:memberId',
  zValidator('json', ZProjectActorUpdateInput.omit({ id: true })),
  async (c) => {
    const auth = await getUserAndThrow(c);
    const { projId, memberId } = c.req.param();
    const input = c.req.valid('json');
    const result = await actorsService.updateProjectActor(
      { projectId: projId, actorId: memberId, ...input },
      { actorId: auth.id },
    );
    return c.json(result);
  },
);

// DELETE /api/v3/projs/:projId/members/:memberId - Remove member from project
projsHono.delete('/:projId/members/:memberId', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId, memberId } = c.req.param();
  const result = await actorsService.removeProjectActor(
    { projectId: projId, actorId: memberId },
    { actorId: auth.id },
  );
  return c.json(result);
});

// ========================== PROJECT STATES API ==========================

// GET /api/v3/projs/:projId/states - List project states (statuses grouped by category)
projsHono.get('/:projId/states', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.listStatuses(projId, { actorId: auth.id });
  return c.json(result);
});

// ========================== PROJECT ARCHIVE APIs ==========================

// POST /api/v3/projs/:projId/archive - Archive project
projsHono.post('/:projId/archive', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.archive(projId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/projs/:projId/unarchive - Unarchive project
projsHono.post('/:projId/unarchive', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.unarchive(projId, { actorId: auth.id });
  return c.json(result);
});

// ========================== PROJECT FAVORITES APIs ==========================

// POST /api/v3/projs/:projId/favorites - Add favorite
projsHono.post('/:projId/favorites', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.addFavorite(projId, { actorId: auth.id });
  return c.json(result, 201);
});

// DELETE /api/v3/projs/:projId/favorites - Remove favorite
projsHono.delete('/:projId/favorites', async (c) => {
  const auth = await getUserAndThrow(c);
  const { projId } = c.req.param();
  const result = await projectsService.removeFavorite(projId, { actorId: auth.id });
  return c.json(result);
});

export const GET = handle(projsHono);
export const POST = handle(projsHono);
export const PUT = handle(projsHono);
export const PATCH = handle(projsHono);
export const DELETE = handle(projsHono);
export const OPTIONS = handle(projsHono);
