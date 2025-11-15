import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/auth';
import { authenticated } from '@/lib/auth/guards';
import { projectsService } from '@/features/projects/server/projects.service';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/v2/projects/:projectId/summary
export const GET = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };
    const { projectId } = params;

    const project = await projectsService.getById(projectId, context);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const totalIssues = await prisma.issue.count({ where: { projectId } });

    // --- Status breakdown ---
    const statusCounts = await prisma.issue.groupBy({
      by: ['statusId'],
      where: { projectId },
      _count: { _all: true },
    });
    const statuses = await prisma.issueStatus.findMany({
      where: { projectId },
      select: { id: true, category: true },
    });

    const categoryCounts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    for (const s of statuses) {
      const grp = statusCounts.find((g) => g.statusId === s.id);
      const cnt = grp?._count?._all ?? 0;
      if (s.category && Object.prototype.hasOwnProperty.call(categoryCounts, s.category)) {
        categoryCounts[s.category] += cnt;
      }
    }

    console.log('=>>>check sumary :' + 'total issers' + totalIssues +" | to do: " + categoryCounts.TODO + " | in progress: " + categoryCounts.IN_PROGRESS + " | done: " + categoryCounts.DONE);

    return NextResponse.json(
      {
        totalIssues,
        todo: categoryCounts.TODO,
        inProgress: categoryCounts.IN_PROGRESS,
        done: categoryCounts.DONE,
      },
      { status: 200 },
    );
  },
);
