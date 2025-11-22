import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';

type Body = { type: 'ISSUE' | 'PROJECT'; entityId: string; context?: any };

// [GET|POST] /api/v2/workspaces/:workspaceId/foryou/viewed
export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  if (!actorId) return NextResponse.json({ items: [] }, { status: 200 });

  const rows = await prisma.viewedItem.findMany({
    where: { userId: actorId, workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const seen = new Set<string>();
  const uniqueRows: typeof rows = [];
  for (const r of rows) {
    const key = `${r.type}:${r.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRows.push(r);
    if (uniqueRows.length >= 50) break;
  }

  const rowsToUse = uniqueRows;

  const issueIds = rowsToUse.filter((r) => r.type === 'ISSUE').map((r) => r.entityId);
  const projectIds = rowsToUse.filter((r) => r.type === 'PROJECT').map((r) => r.entityId);

  const [issues, projects] = await Promise.all([
    issueIds.length ? prisma.issue.findMany({ where: { id: { in: issueIds } }, include: { project: true, type: true, status: true } }) : [],
    projectIds.length ? prisma.project.findMany({ where: { id: { in: projectIds } } }) : [],
  ]);

  const issuesMap = new Map(issues.map((i) => [i.id, i]));
  const projectsMap = new Map(projects.map((p) => [p.id, p]));

  const items = rowsToUse.map((r) => {
    if (r.type === 'ISSUE') {
      const i = issuesMap.get(r.entityId as string) as any;
      return {
        id: r.entityId,
        type: 'ISSUE',
        title: i?.summary ?? 'Untitled',
        projectId: i?.projectId ?? null,
        meta: i?.key ? `${i.key}${i.project ? ` · ${i.project.name}` : ''}`.trim() : (i?.project?.name ?? ''),
        status: i?.status ? { id: i.status.id, name: i.status.name, category: i.status.category } : null,
        iconName: i?.type?.iconURL,
        occurredAt: r.createdAt?.toISOString?.(),
      };
    }

    // PROJECT
    const p = projectsMap.get(r.entityId as string) as any;
    return {
      id: r.entityId,
      type: 'PROJECT',
      title: p?.name ?? 'Project',
      meta: p?.description ?? null,
      occurredAt: r.createdAt?.toISOString?.(),
      avatar: p?.avatar ?? null,
    };
  });

  return NextResponse.json({ items }, { status: 200 });
});

export const POST = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  if (!actorId) return NextResponse.json({ ok: false }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (!body?.entityId || !body?.type) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  // keep only the latest view: update existing record's timestamp/context or create new
  const existing = await prisma.viewedItem.findFirst({
    where: { userId: actorId, workspaceId, entityId: body.entityId, type: body.type },
    select: { id: true },
  });

  if (existing) {
    await prisma.viewedItem.update({
      where: { id: existing.id },
      data: { context: body.context ?? null, createdAt: new Date() },
    });
  } else {
    await prisma.viewedItem.create({
      data: {
        userId: actorId,
        workspaceId,
        type: body.type,
        entityId: body.entityId,
        context: body.context ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
