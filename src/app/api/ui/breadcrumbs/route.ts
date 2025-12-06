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
    label: project.name,
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

// api/ui/breadcrumbs?path=/wps/[workspaceId]/projects/[projectId]/issues/[issueId]
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path'); // e.g. /wps/xxx/projects/yyy/issues/zzz

  // /wps/{workspaceId}/projects/{projectId}
  // /wps/{workspaceId}/projects/{projectId}/issues/{issueId}
  const regex = /^\/wps\/[^/]+\/projects\/([^/]+)(?:\/issues\/([^/]+))?/;
  const match = path ? path.match(regex) : null;

  let breadcrumbs: Breadcrumb[] = [];

  if (match) {
    const projectId = match[1];
    const issueId = match[2];

    if (issueId) {
      // Có issueId → lấy luôn chain [project, parent?, issue]
      breadcrumbs = await getIssueBreadcrumbs(issueId);
    } else {
      // Chỉ có project
      breadcrumbs = await getProjectBreadcrumbs(projectId);
    }
  }

  return NextResponse.json(breadcrumbs, { status: 200 });
}
