import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type DistributionItem = {
  id: string;
  name: string;
  count: number;
  color?: string;
  category?: string;
};

type ProjectSummary = {
  project: {
    id: string;
    key: string;
    name: string;
    avatar?: string | null;
    lead?: {
      id: string;
      name: string;
      avatar?: string | null;
    } | null;
  } | null;
  stats: {
    totalIssues: number;
    openIssues: number;
    inProgressIssues: number;
    doneIssues: number;
    overdueIssues: number;
    unassignedIssues: number;
    storyPoints: {
      total: number;
      completed: number;
    };
  };
  distribution: {
    byStatus: Array<DistributionItem>;
    byType: Array<DistributionItem>;
    byPriority: Array<DistributionItem>;
  };
  currentSprint: {
    id: string;
    name: string;
    state: 'FUTURE' | 'ACTIVE' | 'CLOSED';
    startAt?: Date | null;
    endAt?: Date | null;
    issueCount: number;
    doneIssueCount: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
  } | null;
  workload: Array<{
    assignee: { id: string | null; name: string; avatar?: string | null } | null;
    openIssueCount: number;
    inProgressIssueCount: number;
  }>;
  recentIssues: Array<{
    id: string;
    key: string;
    summary: string;
    status: { id: string; name: string; category?: string };
    assignee?: { id: string; name: string; avatar?: string | null } | null;
    createdAt: Date;
  }>;
};

export async function getProjectSummary(projectId: string): Promise<ProjectSummary> {
  const [
    project,
    issueStats,
    statusDistribution,
    typeDistribution,
    priorityDistribution,
    currentSprint,
    workloadData,
    recentIssues,
  ] = await Promise.all([
    getProjectBasicInfo(projectId),
    getIssueStats(projectId),
    getStatusDistribution(projectId),
    getTypeDistribution(projectId),
    getPriorityDistribution(projectId),
    getCurrentSprint(projectId),
    getWorkloadData(projectId),
    getRecentIssues(projectId),
  ]);

  return {
    project,
    stats: issueStats,
    distribution: {
      byStatus: statusDistribution,
      byType: typeDistribution,
      byPriority: priorityDistribution,
    },
    currentSprint,
    workload: workloadData,
    recentIssues,
  };
}

// Get basic project info with lead details
async function getProjectBasicInfo(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      key: true,
      name: true,
      avatar: true,
      lead: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return project;
}

// Calculate comprehensive issue statistics
async function getIssueStats(projectId: string) {
  const now = new Date();

  const [totalIssues, issuesByCategory, overdueIssues, unassignedIssues, storyPointsStats] =
    await Promise.all([
      // Total issues (excluding archived)
      prisma.issue.count({
        where: {
          projectId,
          archived: false,
        },
      }),

      // Issues grouped by status category
      prisma.issue
        .groupBy({
          by: ['statusId'],
          where: {
            projectId,
            archived: false,
          },
          _count: true,
        })
        .then(async (groups) => {
          const statusIds = groups.map((g) => g.statusId);
          const statuses = await prisma.issueStatus.findMany({
            where: { id: { in: statusIds } },
            select: { id: true, category: true },
          });

          const statusMap = new Map(statuses.map((s) => [s.id, s.category]));

          return {
            todo: groups
              .filter((g) => statusMap.get(g.statusId) === 'TODO')
              .reduce((sum, g) => sum + g._count, 0),
            inProgress: groups
              .filter((g) => statusMap.get(g.statusId) === 'IN_PROGRESS')
              .reduce((sum, g) => sum + g._count, 0),
            done: groups
              .filter((g) => statusMap.get(g.statusId) === 'DONE')
              .reduce((sum, g) => sum + g._count, 0),
          };
        }),

      // Overdue issues (dueDate < now and not DONE)
      prisma.issue.count({
        where: {
          projectId,
          archived: false,
          dueDate: { lt: now },
          status: {
            category: { not: 'DONE' },
          },
        },
      }),

      // Unassigned issues
      prisma.issue.count({
        where: {
          projectId,
          archived: false,
          assigneeId: null,
        },
      }),

      // Story points aggregation
      prisma.issue
        .aggregate({
          where: {
            projectId,
            archived: false,
          },
          _sum: {
            storyPoints: true,
          },
        })
        .then(async (total) => {
          const completed = await prisma.issue.aggregate({
            where: {
              projectId,
              archived: false,
              status: { category: 'DONE' },
            },
            _sum: {
              storyPoints: true,
            },
          });

          return {
            total: total._sum.storyPoints || 0,
            completed: completed._sum.storyPoints || 0,
          };
        }),
    ]);

  const openIssues = issuesByCategory.todo + issuesByCategory.inProgress;

  return {
    totalIssues,
    openIssues,
    inProgressIssues: issuesByCategory.inProgress,
    doneIssues: issuesByCategory.done,
    overdueIssues,
    unassignedIssues,
    storyPoints: storyPointsStats,
  };
}

// Get issue distribution by status with names, colors, and categories
async function getStatusDistribution(projectId: string): Promise<DistributionItem[]> {
  const groups = await prisma.issue.groupBy({
    by: ['statusId'],
    where: {
      projectId,
      archived: false,
    },
    _count: true,
  });

  const statusIds = groups.map((g) => g.statusId);
  const statuses = await prisma.issueStatus.findMany({
    where: { id: { in: statusIds } },
    select: {
      id: true,
      name: true,
      category: true,
      color: true,
    },
  });

  const statusMap = new Map(statuses.map((s) => [s.id, s]));

  return groups.map((group) => {
    const status = statusMap.get(group.statusId);
    return {
      id: group.statusId,
      name: status?.name || 'Unknown',
      count: group._count,
      color: status?.color || undefined,
      category: status?.category || undefined,
    };
  });
}

// Get issue distribution by type with names and colors
async function getTypeDistribution(projectId: string): Promise<DistributionItem[]> {
  const groups = await prisma.issue.groupBy({
    by: ['typeId'],
    where: {
      projectId,
      archived: false,
    },
    _count: true,
  });

  const typeIds = groups.map((g) => g.typeId);
  const types = await prisma.issueType.findMany({
    where: { id: { in: typeIds } },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  const typeMap = new Map(types.map((t) => [t.id, t]));

  return groups.map((group) => {
    const type = typeMap.get(group.typeId);
    return {
      id: group.typeId,
      name: type?.name || 'Unknown',
      count: group._count,
      color: type?.color || undefined,
      category: undefined, // IssueType doesn't have category in schema
    };
  });
}

// Get issue distribution by priority with names and colors
async function getPriorityDistribution(projectId: string): Promise<DistributionItem[]> {
  const groups = await prisma.issue.groupBy({
    by: ['priorityId'],
    where: {
      projectId,
      archived: false,
    },
    _count: true,
  });

  const priorityIds = groups.map((g) => g.priorityId);
  const priorities = await prisma.issuePriority.findMany({
    where: { id: { in: priorityIds } },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  const priorityMap = new Map(priorities.map((p) => [p.id, p]));

  return groups.map((group) => {
    const priority = priorityMap.get(group.priorityId);
    return {
      id: group.priorityId,
      name: priority?.name || 'Unknown',
      count: group._count,
      color: priority?.color || undefined,
      category: undefined, // IssuePriority doesn't have category in schema
    };
  });
}

// Get current active sprint with issue statistics
async function getCurrentSprint(projectId: string) {
  const board = await prisma.board.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (!board) return null;

  const activeSprint = await prisma.sprint.findFirst({
    where: {
      boardId: board.id,
      state: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      state: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!activeSprint) return null;

  // Get all issues in this sprint via SprintIssue junction table
  const sprintIssueIds = await prisma.sprintIssue.findMany({
    where: { sprintId: activeSprint.id },
    select: { issueId: true },
  });

  const issueIds = sprintIssueIds.map((si) => si.issueId);

  if (issueIds.length === 0) {
    return {
      id: activeSprint.id,
      name: activeSprint.name,
      state: activeSprint.state,
      startAt: activeSprint.startAt,
      endAt: activeSprint.endAt,
      issueCount: 0,
      doneIssueCount: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
    };
  }

  const [issueCount, doneIssueCount, totalStoryPoints, completedStoryPoints] = await Promise.all([
    // Total issues in sprint
    prisma.issue.count({
      where: {
        id: { in: issueIds },
        archived: false,
      },
    }),

    // Done issues in sprint
    prisma.issue.count({
      where: {
        id: { in: issueIds },
        archived: false,
        status: { category: 'DONE' },
      },
    }),

    // Total story points in sprint
    prisma.issue
      .aggregate({
        where: {
          id: { in: issueIds },
          archived: false,
        },
        _sum: { storyPoints: true },
      })
      .then((result) => result._sum.storyPoints || 0),

    // Completed story points in sprint
    prisma.issue
      .aggregate({
        where: {
          id: { in: issueIds },
          archived: false,
          status: { category: 'DONE' },
        },
        _sum: { storyPoints: true },
      })
      .then((result) => result._sum.storyPoints || 0),
  ]);

  return {
    id: activeSprint.id,
    name: activeSprint.name,
    state: activeSprint.state,
    startAt: activeSprint.startAt,
    endAt: activeSprint.endAt,
    issueCount,
    doneIssueCount,
    totalStoryPoints,
    completedStoryPoints,
  };
}

// Get workload data grouped by assignee
async function getWorkloadData(projectId: string) {
  const [openIssueGroups, inProgressGroups] = await Promise.all([
    // Open issues by assignee (TODO + IN_PROGRESS)
    prisma.issue.groupBy({
      by: ['assigneeId'],
      where: {
        projectId,
        archived: false,
        status: {
          category: { in: ['TODO', 'IN_PROGRESS'] },
        },
      },
      _count: true,
    }),

    // In progress issues by assignee
    prisma.issue.groupBy({
      by: ['assigneeId'],
      where: {
        projectId,
        archived: false,
        status: { category: 'IN_PROGRESS' },
      },
      _count: true,
    }),
  ]);

  // Get all unique assignee IDs
  const allAssigneeIds = new Set([
    ...openIssueGroups.map((g) => g.assigneeId),
    ...inProgressGroups.map((g) => g.assigneeId),
  ]);

  // Fetch user details for non-null assignees
  const assigneeIds = Array.from(allAssigneeIds).filter((id) => id !== null) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true, avatar: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const openCountMap = new Map(openIssueGroups.map((g) => [g.assigneeId, g._count]));
  const inProgressCountMap = new Map(inProgressGroups.map((g) => [g.assigneeId, g._count]));

  return Array.from(allAssigneeIds).map((assigneeId) => ({
    assignee: assigneeId
      ? {
          id: assigneeId,
          name: userMap.get(assigneeId)?.name || 'Unknown User',
          avatar: userMap.get(assigneeId)?.avatar,
        }
      : {
          id: null,
          name: 'Unassigned',
          avatar: null,
        },
    openIssueCount: openCountMap.get(assigneeId) || 0,
    inProgressIssueCount: inProgressCountMap.get(assigneeId) || 0,
  }));
}

// Get recent issues with full details
async function getRecentIssues(projectId: string) {
  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      archived: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      key: true,
      summary: true,
      createdAt: true,
      status: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return issues.map((issue) => ({
    id: issue.id,
    key: issue.key,
    summary: issue.summary,
    status: {
      id: issue.status.id,
      name: issue.status.name,
      category: issue.status.category,
    },
    assignee: issue.assignee,
    createdAt: issue.createdAt,
  }));
}
