import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// [GET] /api/v2/workspaces/:workspaceId/foryou/assigned
export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  if (!actorId) return NextResponse.json({ items: [] }, { status: 200 });

  const { objects } = await openfgaClient.listObjects({
    user: `user:${actorId}`,
    type: 'project',
    relation: 'can_view',
  });

  let projectIds = objects.map((o) => o.replace('project:', ''));
  if (workspaceId) {
    const projRows = await prisma.project.findMany({
      where: { id: { in: projectIds }, workspaceId },
      select: { id: true },
    });
    projectIds = projRows.map((p) => p.id);
  }

  if (projectIds.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  // select only necessary fields to reduce DB and network overhead
  const issues = await prisma.issue.findMany({
    where: { projectId: { in: projectIds }, assigneeId: actorId },
    include: {
      project: { select: { id: true, name: true } },
      status: { select: { id: true, name: true, category: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  const items = issues.map((i) => ({
    id: i.id,
    iconName: i.archived ? 'CheckSquare' : 'LayoutGrid',
    title: i.summary ?? 'Untitled',
    meta: `${i.key ?? ''}${i.project ? ` · ${i.project.name}` : ''}`.trim(),
    // the UI only needs status for the Assigned tab; avoid extra fields
    status: i.status ? { id: i.status.id, name: i.status.name, category: i.status.category } : null,
    occurredAt: i.updatedAt?.toISOString?.(),
  }));

//   console.log(">>>>>>>>>>check : " + JSON.stringify(items));
  

  return NextResponse.json({ items }, { status: 200 });
});
