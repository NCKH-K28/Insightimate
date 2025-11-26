import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Body = { type: 'ISSUE' | 'PROJECT'; entityId: string; context?: any };

// [GET] /api/v2/workspaces/:workspaceId/foryou/viewed
export const GET = middlewareHandler([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;
  const { params } = req;
  const workspaceId = (params as any)?.workspaceId as string | undefined;

  if (!actorId) return NextResponse.json({ items: [] }, { status: 200 });

  
  const rows = await prisma.activity.findMany({
    where: { userId: actorId, workspaceId, type: 'VIEWED' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const seen = new Set<string>();
  const rowsToUse: typeof rows = [];
  for (const r of rows) {
    const key = `${r.sourceType}:${r.sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rowsToUse.push(r);
    if (rowsToUse.length >= 50) break;
  }

  const issueIds = rowsToUse.filter((r) => r.sourceType === 'ISSUE').map((r) => r.sourceId);
  const projectIds = rowsToUse.filter((r) => r.sourceType === 'PROJECT').map((r) => r.sourceId);

  const [issues, projects] = await Promise.all([
    issueIds.length ? prisma.issue.findMany({ where: { id: { in: issueIds } }, include: { project: true, type: true, status: true } }) : [],
    projectIds.length ? prisma.project.findMany({ where: { id: { in: projectIds } } }) : [],
  ]);

  const issuesMap = new Map(issues.map((i) => [i.id, i]));
  const projectsMap = new Map(projects.map((p) => [p.id, p]));

  const projectCounts = new Map<string, { total: number; done: number }>();
  if (projects.length) {
    await Promise.all(
      projects.map(async (p) => {
        const [total, done] = await Promise.all([
          prisma.issue.count({ where: { projectId: p.id, archived: false } }),
          prisma.issue.count({ where: { projectId: p.id, archived: false, status: { is: { category: 'DONE' } } } }),
        ]);
        projectCounts.set(p.id, { total, done });
      }),
    );
  }

  const projectColors = ['bg-sky-400', 'bg-violet-500', 'bg-emerald-400', 'bg-amber-400', 'bg-indigo-400'];
  function hashCode(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  const items = rowsToUse.map((r) => {
    if (r.sourceType === 'ISSUE') {
      const i = issuesMap.get(r.sourceId as string) as any;
      return {
        id: r.sourceId,
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
    const p = projectsMap.get(r.sourceId as string) as any;
    const counts = projectCounts.get(r.sourceId as string) ?? { total: 0, done: 0 };

    return {
      type: 'PROJECT',
      id: r.sourceId,
      title: p?.name ?? 'Project',
      projectType: p?.type ?? null,
      totalIssues: counts.total,
      doneIssues: counts.done,
      meta: p?.description ?? null,
      occurredAt: r.createdAt?.toISOString?.(),
      avatar: p?.avatar ?? null,
      color: projectColors[Math.abs(hashCode(String(r.sourceId))) % projectColors.length],
    };
  });

  return NextResponse.json({ items }, { status: 200 });
});

// [POST] /api/v2/workspaces/:workspaceId/foryou/viewed
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

  const existing = await prisma.activity.findFirst({
    where: {
      userId: actorId,
      workspaceId,
      sourceId: body.entityId,
      sourceType: body.type,
      type: 'VIEWED',
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.activity.update({
      where: { id: existing.id },
      data: { context: body.context ?? null, createdAt: new Date(), createdBy: actorId },
    });
  } else {
    await prisma.activity.create({
      data: {
        userId: actorId,
        workspaceId,
        type: 'VIEWED',
        sourceType: body.type as any,
        sourceId: body.entityId,
        context: body.context ?? null,
        createdBy: actorId,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
