import { Hono } from 'hono';
import { authenticatedHono } from '@/lib/authn';
import { httpExceptionFilterHono } from '@/lib/http/filters';
import { handle } from 'hono/vercel';

const projsHono = new Hono().basePath('/api/v3/projs');
projsHono.use(authenticatedHono);
projsHono.onError(httpExceptionFilterHono);

// POST /api/v3/projs - Create project
// GET /api/v3/projs/:projId - Detail (include lead, perms)
// PATCH /api/v3/projs/:projId - Update project (name/description/avatar)
// DELETE /api/v3/projs/:projId - Delete project (soft delete)

// GET /api/v3/projs/:projId/actors - List actors in project (user/team)
// POST /api/v3/projs/:projId/actors - Add actor to project
// DELETE /api/v3/projs/:projId/actors/:actorId - Remove actor from project
// PATCH /api/v3/projs/:projId/actors/:actorId - Update actor in project

export const GET = handle(projsHono);
export const POST = handle(projsHono);
export const PATCH = handle(projsHono);
export const DELETE = handle(projsHono);
export const OPTIONS = handle(projsHono);
