import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// [GET] /api/v2/workspaces/:workspaceId/foryou/worked
export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  if (!actorId) return NextResponse.json({ items: [] }, { status: 200 });

  // lấy list project mà user có quyền xem
  const { objects } = await openfgaClient.listObjects({
    user: `user:${actorId}`,
    type: 'project',
    relation: 'can_view',
  });

  let projectIds = objects.map((o) => o.replace('project:', ''));
  if (workspaceId) {
    const projRows = await prisma.project.findMany({ where: { id: { in: projectIds }, workspaceId } });
    projectIds = projRows.map((p) => p.id);
  }

  if (projectIds.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const issues = await prisma.issue.findMany({
    where: {
      projectId: { in: projectIds },
      OR: [
        { assigneeId: actorId },
        { reporterId: actorId },
        { updatedAt: { gte: startOfDay } },
      ],
    },
    include: { project: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  const items = issues.map((i) => ({
    id: i.id,
    iconName: i.archived ? 'CheckSquare' : 'LayoutGrid',
    title: (i as any).summary ?? (i as any).subject ?? 'Untitled',
    meta: `${(i as any).key ?? ''}${i.project ? ` · ${i.project.name}` : ''}`.trim(),
    checked: (i as any).status?.category === 'DONE',
    action:
      i.updatedAt && i.createdAt && new Date(i.updatedAt).getTime() > new Date(i.createdAt).getTime()
        ? 'Updated'
        : 'Created',
    actor: { name: auth.user.email ?? auth.user.id, avatar: null },
    occurredAt: i.updatedAt?.toISOString?.(),
  }));

  return NextResponse.json({ items }, { status: 200 });
});
