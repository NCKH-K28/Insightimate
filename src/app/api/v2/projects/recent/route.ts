import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// [GET] /api/v2/projects/recent
export const GET = middlewareHandler<{ }>([authenticated], async (req) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  // list all project objects the user can view
  const { objects } = await openfgaClient.listObjects({
    user: `user:${actorId}`,
    type: 'project',
    relation: 'can_view',
  });

  const projectIds = objects.map((o) => o.replace('project:', ''));
  if (projectIds.length === 0) return NextResponse.json({ data: [] }, { status: 200 });

  // fetch most recently updated projects the user can view
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    include: { lead: true, workspace: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });

  // compute quick counts per project (open/done issues, boards)
  const mapped = await Promise.all(
    projects.map(async (p) => {
      const [boardsCount, openCount, doneCount] = await Promise.all([
        prisma.board.count({ where: { projectId: p.id } }),
        prisma.issue.count({
          where: {
            projectId: p.id,
            archived: false,
            // statuses where category != DONE
            status: { is: { category: { not: 'DONE' } } },
          },
        }),
        prisma.issue.count({
          where: {
            projectId: p.id,
            archived: false,
            status: { is: { category: 'DONE' } },
          },
        }),
      ]);

      // derive a tailwind color class from id if not present
      const colors = ['bg-sky-400', 'bg-violet-500', 'bg-emerald-400', 'bg-amber-400', 'bg-indigo-400'];
      const color = colors[Math.abs(hashCode(p.id)) % colors.length];

      return {
        id: p.id,
        name: p.name,
        type: p.type ?? 'SOFTWARE',
        avatar: p.avatar ?? null,
        description: (p as any).description ?? null,
        leadId: p.leadId,
        workspaceId: p.workspaceId,
        boardId: (p as any).boardId ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        color,
        openItems: openCount,
        doneItems: doneCount,
        boards: boardsCount,
      };
    }),
  );

  console.log("check res :", JSON.stringify(mapped, null, 2));
  

  return NextResponse.json({ data: mapped }, { status: 200 });
});

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
