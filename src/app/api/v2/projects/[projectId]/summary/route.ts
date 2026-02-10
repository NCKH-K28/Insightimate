import { middlewareHandler } from '@/lib/http/api-handler';
import { getAuthFromRequest } from '@/lib/authn';
import { authenticated } from '@/lib/authn/guards';
import { projectsService } from '@/features/project/server/projects.service';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// [GET] /api/v2/projects/:projectId/summary
export const GET = middlewareHandler<{ projectId: string }>(
  [authenticated],
  async (req, { params }) => {
    const auth = await getAuthFromRequest(req);
    const context = { actorId: auth.user.id };
    const { projectId } = params;

    const project = await projectsService.getById(projectId, context);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const totalIssues = await prisma.issue.count({ where: { projectId } });

    const statusCounts = await prisma.issue.groupBy({
      by: ['statusId'],
      where: { projectId },
      _count: { _all: true },
    });

    const statuses = await prisma.issueStatus.findMany({
      where: { projectId },
      select: { id: true, name: true, color: true, sequence: true },
      orderBy: { sequence: 'asc' },
    });

    const statusData = statuses.map((s) => {
      const grp = statusCounts.find((g) => g.statusId === s.id);
      return {
        status: s.id,
        label: s.name,
        value: grp?._count?._all ?? 0,
        fill: s.color || null,
      };
    });

    const categoryCounts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    // for (const s of statusData) {
    //   // try to fetch status category if available
    //   // load status record with category if we need it; but to keep this simple we will
    //   // re-query categories for statuses that map to known categories
    // }

    const statusesWithCategory = await prisma.issueStatus.findMany({
      where: { projectId },
      select: { id: true, category: true },
    });
    const catMap = Object.fromEntries(statusesWithCategory.map((it) => [it.id, it.category]));
    for (const s of statusData) {
      const cat = catMap[s.status];
      if (cat && Object.prototype.hasOwnProperty.call(categoryCounts, cat)) {
        categoryCounts[cat] += s.value;
      }
    }

    // console.log('=>>>check sumary :' + 'total issers' + totalIssues +" | to do: " + categoryCounts.TODO + " | in progress: " + categoryCounts.IN_PROGRESS + " | done: " + categoryCounts.DONE);

    const workspaceObj = project.workspaceId
      ? await prisma.workspace.findUnique({
          where: { id: project.workspaceId },
          select: { id: true, name: true },
        })
      : null;
    const leadObj = project.leadId
      ? await prisma.user.findUnique({
          where: { id: project.leadId },
          select: { id: true, name: true, email: true },
        })
      : null;

    const projectOverview = {
      workspace: workspaceObj?.name ?? null,
      lead: leadObj ? (leadObj.name ?? leadObj.email ?? null) : null,
      startDate: project.createdAt ?? null,
      version: (project as any).version ?? null,
    };

    const priorityCounts = await prisma.issue.groupBy({
      by: ['priorityId'],
      where: { projectId },
      _count: { _all: true },
    });

    const priorities = await prisma.issuePriority.findMany({
      where: { projectId },
      select: { id: true, name: true, iconURL: true, sequence: true },
      orderBy: { sequence: 'asc' },
    });

    const priorityData = priorities.map((p) => {
      const grp = priorityCounts.find((g) => g.priorityId === p.id);
      return {
        priority: p.id,
        label: p.name,
        value: grp?._count?._all ?? 0,
        icon: p.iconURL ?? null,
      };
    });

    // Quick stats
    const backlog = await prisma.issue.count({
      where: { projectId, archived: false },
    });
    const bugs = await prisma.issue.count({
      where: { projectId, type: { name: { equals: 'Bug', mode: 'insensitive' } } },
    });

    const activeSprints = await prisma.sprint.count({
      where: { board: { projectId }, state: 'ACTIVE' },
    });

    const quickStats = {
      backlog,
      bugs,
      activeSprints,
    };

    return NextResponse.json(
      {
        totalIssues,
        todo: categoryCounts.TODO,
        inProgress: categoryCounts.IN_PROGRESS,
        done: categoryCounts.DONE,
        statusData,
        priorityData,
        quickStats,
        projectOverview,
      },
      { status: 200 },
    );
  },
);
