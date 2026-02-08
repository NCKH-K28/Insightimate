import z from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { loadPrincipal, projectResourceFactory } from '@/features/authz/server/pip';
import { PROJECT_ACTIONS } from '@/contracts/projects';
import { checkResourcesMapped } from '@/lib/authz/clients/cerbos';

export const ZProjectFilter = z.object({
  q: z.string().optional(),
  ids: z.array(z.string()).min(1).optional(),
  workspaceId: z.string().optional(),
});

export const ZProjectListInput = z.object({ filter: ZProjectFilter.optional() });
export const ZProjectListOutput = z.object({
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().nullable(),
      key: z.string(),
      description: z.string().nullable(),
    })
    .array(),
  meta: z.object({ total: z.number().optional() }).optional(),
});

export type ProjectListInput = z.infer<typeof ZProjectListInput>;
export type ProjectListOutput = z.infer<typeof ZProjectListOutput>;

// =============================== SERVICES
const listProjectObjects = async (actorId: string) => {
  const { objects } = await openfgaClient.listObjects({
    user: `user:${actorId}`,
    type: 'project',
    relation: 'can_view',
  });
  return objects.map((obj) => obj.replace('project:', ''));
};

type ProjectContext = { actorId: string };

const buildWhere = async (
  { filter }: ProjectListInput,
  context: ProjectContext,
): Promise<Prisma.ProjectWhereInput | null> => {
  const allowedIds = await listProjectObjects(context.actorId);
  if (allowedIds.length === 0) return null;

  const where: Prisma.ProjectWhereInput & { id: { in: string[] } } = { id: { in: [] } };
  if (filter?.workspaceId) where.workspaceId = filter.workspaceId;
  if (filter?.ids) where.id = { in: filter.ids };
  if (filter?.q) {
    where.OR = [
      { name: { contains: filter.q, mode: 'insensitive' } },
      { key: { contains: filter.q, mode: 'insensitive' } },
      { description: { contains: filter.q, mode: 'insensitive' } },
    ];
  }

  // === FILTER with allowedIds
  const allowedSet = new Set(allowedIds);
  const filteredIds = where.id.in.filter((id) => allowedSet.has(id));
  const finalIds = filteredIds.length > 0 ? filteredIds : allowedIds;
  where.id.in = finalIds;

  return where;
};

export const searchProjects = async (input: ProjectListInput, context: ProjectContext) => {
  const options = { include: { permissions: false }, ...input };

  const where = await buildWhere(options, context);
  if (where === null) return ZProjectListOutput.parse({ data: [], meta: { total: 0 } });

  const projects = await prisma.project.findMany({
    where,
    include: { lead: true, workspace: true },
    orderBy: { createdAt: 'desc' },
  });

  if (projects.length === 0) return ZProjectListOutput.parse({ data: [], meta: { total: 0 } });
  if (!options.include.permissions) return ZProjectListOutput.parse({ data: projects });

  // === With permissions
  const resources = projects.map(projectResourceFactory);
  const principal = await loadPrincipal(context, {}, resources);
  const actions = Array.from(PROJECT_ACTIONS);

  const resourcesWithActions = resources.map((r) => ({ resource: r, actions }));
  const { results } = await checkResourcesMapped({
    resources: resourcesWithActions,
    principal: principal,
  });

  const data = projects.map((p) => ({ ...p, permissions: results[p.id]?._actions }));
  return ZProjectListOutput.parse({ data });
};
