import { Hono } from 'hono';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/authn';
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

const projsHono = new Hono().basePath('/api/v3/projs');
projsHono.use(authenticatedHono);
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
  const auth = await getAuthFromRequestHono(c);
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
  const auth = await getAuthFromRequestHono(c);
  const input = c.req.valid('json');
  const result = await projectsService.create(input, { actorId: auth.id });
  return c.json(result);
});

// GET /api/v3/projs/:projId - Get project by ID
projsHono.get('/:projId', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { projId } = c.req.param();
  const result = await projectsService.getById(projId, { actorId: auth.id });
  return c.json(result);
});

// PATCH /api/v3/projs/:projId - Update project
projsHono.patch('/:projId', zValidator('json', ZProjectUpdateInput), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { projId } = c.req.param();
  const input = c.req.valid('json');
  const result = await projectsService.update(projId, input, { actorId: auth.id });
  return c.json(result);
});

// DELETE /api/v3/projs/:projId - Delete project
projsHono.delete('/:projId', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { projId } = c.req.param();
  const result = await projectsService.delete(projId, { actorId: auth.id });
  return c.json(result);
});

// ========================== PROJECT ACTORS APIs ==========================

// GET /api/v3/projs/:projId/actors - List actors in project
projsHono.get('/:projId/actors', async (c) => {
  const auth = await getAuthFromRequestHono(c);
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
    const auth = await getAuthFromRequestHono(c);
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
    const auth = await getAuthFromRequestHono(c);
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
  const auth = await getAuthFromRequestHono(c);
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
  const auth = await getAuthFromRequestHono(c);
  const { projId } = c.req.param();
  const result = await rolesService.listProjectRoles(projId, { actorId: auth.id });
  return c.json(result);
});

// POST /api/v3/projs/:projId/roles - Create role in project
projsHono.post(
  '/:projId/roles',
  zValidator('json', ZProjectRoleCreateInput.omit({ projectId: true })),
  async (c) => {
    const auth = await getAuthFromRequestHono(c);
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
  const auth = await getAuthFromRequestHono(c);
  const { roleId } = c.req.param();
  const result = await rolesService.getProjectRoleById(roleId, { actorId: auth.id });
  return c.json(result);
});

// DELETE /api/v3/projs/:projId/roles/:roleId - Delete role
projsHono.delete('/:projId/roles/:roleId', async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const { roleId } = c.req.param();
  const result = await rolesService.deleteProjectRole(roleId, { actorId: auth.id });
  return c.json(result);
});

export const GET = handle(projsHono);
export const POST = handle(projsHono);
export const PATCH = handle(projsHono);
export const DELETE = handle(projsHono);
export const OPTIONS = handle(projsHono);
