import { ZProjectQueryParams, ZProjectFacets } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const queryParams = ZProjectQueryParams.parse(req.query);

  const buildWhere = (): Prisma.ProjectWhereInput => {
    const userId = auth.user.id;
    const filter = queryParams.filter;

    const where: Prisma.ProjectWhereInput = {};

    if (filter?.search) where.name = { contains: filter.search, mode: 'insensitive' };
    if (filter?.workspaceId) where.workspaceId = filter.workspaceId;

    where.OR = [
      { leadId: userId },
      { actors: { some: { actorType: 'USER', actorId: userId } } },
      { workspace: { ownerId: userId } },
    ];

    return where;
  };

  const where = buildWhere();

  const projects = await prisma.project.findMany({
    where,
    include: {
      lead: true,
      workspace: {
        select: {
          id: true,
          ownerId: true,
          members: { where: { userId: auth.user.id } },
        },
      },
    },
    orderBy: [{ leadId: 'desc' }, { createdAt: 'desc' }],
  });

  // const sortedProjects = projects.sort((a, b) => {
  //   if (a.leadId === auth.user.id) return -1;
  //   if (b.leadId === auth.user.id) return 1;
  //   return 0;
  // });

  const [typeRows, leadRows] = await Promise.all([
    prisma.project.groupBy({ by: ['type'], where, _count: { _all: true } }),
    prisma.project.groupBy({ by: ['leadId'], where, _count: { _all: true } }),
  ]);

  const leadIds = leadRows.map((r) => r.leadId);
  const leads = await prisma.user.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, name: true, email: true, avatar: true },
  });
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const facets = {
    types: typeRows.map((r) => ({ value: r.type, label: r.type, count: r._count._all })),
    leads: leadRows.map((r) => ({
      value: r.leadId,
      label: leadMap.get(r.leadId) || null,
      count: r._count._all,
    })),
  };

  const data = ZProjectFacets.parse(facets);
  return NextResponse.json(data, { status: 200 });
});
