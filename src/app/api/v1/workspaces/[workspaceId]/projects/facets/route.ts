import { ZProjectFacets } from '@/contracts/projects';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { get } from 'lodash';
import { NextResponse } from 'next/server';

export const GET = middlewareHandler<{ workspaceId: string }>(
  [authenticated],
  async (request, ctx) => {
    const user = get(request, 'auth.user', null);
    const params = ctx.params;
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = get(user, 'id', null);
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // ============== Application Layer
    const getFacets = async () => {
      const { workspaceId } = params;
      const where: Prisma.ProjectWhereInput = {
        workspaceId,
        OR: [{ leadId: userId }, { actors: { some: { actorType: 'USER', actorId: userId } } }],
      };
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

      return {
        types: typeRows.map((r) => ({ value: r.type, label: r.type, count: r._count._all })),
        leads: leadRows.map((r) => ({
          value: r.leadId,
          label: leadMap.get(r.leadId) || null,
          count: r._count._all,
        })),
      };
    };

    const facets = await getFacets();
    const data = ZProjectFacets.parse(facets);
    return NextResponse.json(data, { status: 200 });
  },
);
