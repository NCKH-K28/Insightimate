import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { openfgaClient } from '@/lib/auth/authz/openfga';
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
    const projRows = await prisma.project.findMany({
      where: { id: { in: projectIds }, workspaceId },
    });
    projectIds = projRows.map((p) => p.id);
  }

  if (projectIds.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  const issueRows = await prisma.issue.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      id: true,
      projectId: true,
      summary: true,
      key: true,
      type: true,
      project: { select: { name: true } },
    },
  });

  if (issueRows.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  const issueMap = new Map(issueRows.map((r) => [r.id, r]));

  const issueIds = issueRows.map((r) => r.id);
  const userActivities = await prisma.activity.findMany({
    where: {
      workspaceId: workspaceId ?? null,
      sourceType: 'ISSUE',
      sourceId: { in: issueIds },
      userId: actorId,
      type: { in: ['CREATED', 'UPDATED', 'COMMENTED'] },
    },
    distinct: ['sourceId'],
  });

  const interactedIssueIds = Array.from(new Set(userActivities.map((a) => a.sourceId)));
  if (interactedIssueIds.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  const activities = await prisma.activity.findMany({
    where: {
      workspaceId: workspaceId ?? null,
      sourceType: 'ISSUE',
      sourceId: { in: interactedIssueIds },
      type: { in: ['CREATED', 'UPDATED', 'COMMENTED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  if (activities.length === 0) return NextResponse.json({ items: [] }, { status: 200 });

  const userIds = Array.from(new Set(activities.map((a) => a.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, avatar: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const itemsMap = new Map<string, any>();
  for (const act of activities) {
    const key = act.sourceId;
    const issue = issueMap.get(key as string);
    if (!issue) continue;

    if (!itemsMap.has(key)) {
      itemsMap.set(key, {
        id: issue.id,
        projectId: issue.projectId,
        title: issue.summary ?? (act.context as any)?.title ?? '',
        meta: issue?.key
          ? `${issue.key}${issue.project ? ` · ${issue.project.name}` : ''}`.trim()
          : (issue?.project?.name ?? ''),
        action:
          act.type === 'CREATED' ? 'Created' : act.type === 'COMMENTED' ? 'Commented' : 'Updated',
        icon: issue.type.iconURL ?? null,
        actors: [],
        occurredAt: act.createdAt?.toISOString?.(),
      });
    }

    const entry = itemsMap.get(key)!;
    const actorId = act.userId;
    if (!entry.actors.find((x: any) => x.id === actorId)) {
      const u = userMap.get(actorId) ?? {
        id: actorId,
        name: act.createdBy ?? actorId,
        avatar: null,
      };
      entry.actors.push({
        id: u.id,
        name: (u as any).name ?? (u as any).email ?? u.id,
        avatar: (u as any).avatar ?? null,
      });
    }
  }

  const items = Array.from(itemsMap.values()).slice(0, 50);
  return NextResponse.json({ items }, { status: 200 });
});
