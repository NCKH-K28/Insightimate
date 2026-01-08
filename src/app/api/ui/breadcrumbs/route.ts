import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Breadcrumb = {
  label: string;
  href: string;
  iconURL?: string | null;
};

// Trả về breadcrumbs dạng:
// [ Project, (Parent Issue?), Current Issue ]
const getIssueBreadcrumbs = async (issueId: string): Promise<Breadcrumb[]> => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      type: true,
      parent: {
        include: {
          type: true,
        },
      },
      project: true,
    },
  });

  if (!issue || !issue.project) {
    return [];
  }

  const project = issue.project;
  const projectHref = `/wps/${project.workspaceId}/projects/${project.id}`;

  const breadcrumbs: Breadcrumb[] = [];

  // Project
  breadcrumbs.push({
    label: project.key,
    href: projectHref,
    iconURL: project.avatar,
  });

  // Parent issue (nếu có)
  if (issue.parent) {
    const parent = issue.parent;
    const parentType = parent.type;

    breadcrumbs.push({
      label: parent.key,
      href: `${projectHref}/issues/${parent.id}`,
      iconURL: parentType?.iconURL ?? null,
    });
  }

  // Current issue
  const issueType = issue.type;

  breadcrumbs.push({
    label: issue.key,
    href: `${projectHref}/issues/${issue.id}`,
    iconURL: issueType?.iconURL ?? null,
  });

  return breadcrumbs;
};

const getProjectBreadcrumbs = async (projectId: string): Promise<Breadcrumb[]> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) return [];

  return [
    {
      label: project.name,
      href: `/wps/${project.workspaceId}/projects/${project.id}`,
      iconURL: project.avatar,
    },
  ];
};

const getSprintBreadcrumbs = async (sprintId: string): Promise<Breadcrumb[]> => {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      board: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!sprint || !sprint.board || !sprint.board.project) {
    return [];
  }

  const project = sprint.board.project;
  const projectHref = `/wps/${project.workspaceId}/projects/${project.id}`;

  return [
    {
      label: project.name,
      href: projectHref,
      iconURL: project.avatar,
    },
    {
      label: sprint.name,
      href: `${projectHref}/sprints/${sprint.id}`,
    },
  ];
};

// api/ui/breadcrumbs?path=/wps/[workspaceId]/projects/[projectId]/issues/[issueId]
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path'); // e.g. /wps/xxx/projects/yyy/issues/zzz

  // /wps/{workspaceId}/projects/{projectId}
  // /wps/{workspaceId}/projects/{projectId}/issues/{issueId}
  // /wps/{workspaceId}/sprints/{sprintId}
  // const regex = /^\/wps\/[^/]+\/projects\/([^/]+)(?:\/issues\/([^/]+))?/;
  const regex = /^\/wps\/[^/]+\/(projects|sprints)\/([^/]+)(?:\/issues\/([^/]+))?/;
  const match = path ? path.match(regex) : null;

  let breadcrumbs: Breadcrumb[] = [];

  if (match) {
    const entityType = match[1]; // 'projects' or 'sprints'
    if (entityType === 'projects') {
      const projectId = match[2];
      const issueId = match[3];

      if (issueId) {
        // Breadcrumbs cho issue
        breadcrumbs = await getIssueBreadcrumbs(issueId);
      } else {
        // Breadcrumbs cho project
        breadcrumbs = await getProjectBreadcrumbs(projectId);
      }
    } else if (entityType === 'sprints') {
      const sprintId = match[2];
      // Breadcrumbs cho sprint
      breadcrumbs = await getSprintBreadcrumbs(sprintId);
    }
  }

  return NextResponse.json(breadcrumbs, { status: 200 });
}
