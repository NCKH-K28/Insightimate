import 'server-only';

import { prisma } from '@/lib/prisma';
import { openfgaClient } from '@/lib/authz/clients/openfga';
import { subDays } from 'date-fns';

// ==================== Types ====================

type DashboardContext = { actorId: string };

export type DashboardStats = {
  projectCount: number;
  memberCount: number;
  openIssueCount: number;
  activityCount7d: number;
};

export type RecentProject = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  updatedAt: Date;
  lead: { id: string; name: string; avatar: string | null } | null;
  _issueCount: number;
  completionPercent: number;
  statusLabel: string;
};

export type TeamMember = {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
};

export type AssignedIssue = {
  id: string;
  key: string;
  summary: string;
  dueDate: Date | null;
  updatedAt: Date;
  project: { id: string; key: string; name: string };
  status: { id: string; name: string; color: string | null; category: string };
  priority: { id: string; name: string; color: string | null; iconURL: string | null };
  type: { id: string; name: string; color: string | null; iconURL: string | null };
};

export type DashboardData = {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  assignedToMe: AssignedIssue[];
  teamMembers: TeamMember[];
};

// ==================== Helpers ====================

async function getAllowedProjectIds(orgId: string, ctx: DashboardContext): Promise<string[]> {
  const { objects } = await openfgaClient.listObjects({
    user: `user:${ctx.actorId}`,
    type: 'proj',
    relation: 'read',
  });
  const allProjectIds = objects.map((obj) => obj.replace('proj:', ''));
  if (allProjectIds.length === 0) return [];

  // Filter to only projects in this org
  const orgProjects = await prisma.project.findMany({
    where: { id: { in: allProjectIds }, orgId },
    select: { id: true },
  });
  return orgProjects.map((p) => p.id);
}

// ==================== Service Functions ====================

async function getStats(orgId: string, allowedProjectIds: string[]): Promise<DashboardStats> {
  const sevenDaysAgo = subDays(new Date(), 7);

  const [projectCount, memberCount, openIssueCount, activityCount7d] = await Promise.all([
    // Projects the user can see in this org
    Promise.resolve(allowedProjectIds.length),

    // Total org members
    prisma.orgMember.count({ where: { orgId } }),

    // Open issues (TODO + IN_PROGRESS) across accessible projects
    allowedProjectIds.length > 0
      ? prisma.issue.count({
          where: {
            projectId: { in: allowedProjectIds },
            archived: false,
            status: { category: { in: ['TODO', 'IN_PROGRESS'] } },
          },
        })
      : 0,

    // Activity count in last 7 days
    prisma.activityEvent.count({
      where: {
        orgId,
        createdAt: { gte: sevenDaysAgo },
        OR: [{ projectId: { in: allowedProjectIds } }, { projectId: null }],
      },
    }),
  ]);

  return { projectCount, memberCount, openIssueCount, activityCount7d };
}

async function getRecentProjects(
  orgId: string,
  allowedProjectIds: string[],
): Promise<RecentProject[]> {
  if (allowedProjectIds.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: { id: { in: allowedProjectIds }, orgId },
    include: {
      lead: { select: { id: true, name: true, avatar: true } },
      _count: { select: { issues: true } },
      issues: {
        where: { archived: false },
        select: { status: { select: { category: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return projects.map((p) => {
    const total = p.issues.length;
    const done = p.issues.filter((i) => i.status.category === 'DONE').length;
    const inProgress = p.issues.some((i) => i.status.category === 'IN_PROGRESS');
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    let statusLabel = 'NOT STARTED';
    if (completionPercent === 100) statusLabel = 'DONE';
    else if (inProgress || done > 0) statusLabel = 'IN PROGRESS';

    return {
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      type: p.type,
      updatedAt: p.updatedAt,
      lead: p.lead,
      _issueCount: p._count.issues,
      completionPercent,
      statusLabel,
    };
  });
}

async function getAssignedToMe(
  orgId: string,
  allowedProjectIds: string[],
  ctx: DashboardContext,
): Promise<AssignedIssue[]> {
  if (allowedProjectIds.length === 0) return [];

  const issues = await prisma.issue.findMany({
    where: {
      projectId: { in: allowedProjectIds },
      assigneeId: ctx.actorId,
      archived: false,
      status: { category: { in: ['TODO', 'IN_PROGRESS'] } },
    },
    include: {
      project: { select: { id: true, key: true, name: true } },
      status: {
        select: { id: true, name: true, color: true, category: true },
      },
      priority: {
        select: { id: true, name: true, color: true, iconURL: true },
      },
      type: {
        select: { id: true, name: true, color: true, iconURL: true },
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 10,
  });

  return issues.map((i) => ({
    id: i.id,
    key: i.key,
    summary: i.summary,
    dueDate: i.dueDate,
    updatedAt: i.updatedAt,
    project: i.project,
    status: i.status,
    priority: i.priority,
    type: i.type,
  }));
}

const ORG_ROLE_DISPLAY: Record<string, string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

async function getTeamMembers(orgId: string): Promise<TeamMember[]> {
  const members = await prisma.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar: m.user.avatar,
    role: ORG_ROLE_DISPLAY[m.role] ?? 'Member',
  }));
}

async function getDashboard(orgId: string, ctx: DashboardContext): Promise<DashboardData> {
  const allowedProjectIds = await getAllowedProjectIds(orgId, ctx);

  const [stats, recentProjects, assignedToMe, teamMembers] = await Promise.all([
    getStats(orgId, allowedProjectIds),
    getRecentProjects(orgId, allowedProjectIds),
    getAssignedToMe(orgId, allowedProjectIds, ctx),
    getTeamMembers(orgId),
  ]);

  return { stats, recentProjects, assignedToMe, teamMembers };
}

// ==================== Export ====================

export const dashboardService = {
  getDashboard,
  getStats,
  getRecentProjects,
  getAssignedToMe,
  getTeamMembers,
};
