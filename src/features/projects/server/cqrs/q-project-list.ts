import { ProjectQueryParams } from '../../../../.temp/schemas/project';
import { prisma } from '@/lib/prisma';

export const listProjects = async (
  context: { user: { id: string } },
  params: ProjectQueryParams,
) => {
  const { user } = context;
  const { id: userId } = user;

  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      OR: [{ leadId: userId }, { actors: { some: { actorType: 'USER', actorId: userId } } }],
    },
    include: {
      board: { select: { id: true } },
      lead: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const projectsWithPermissions = projects.map((project) => ({
    ...project,
    boardId: project.board?.id,
    permissions: {},
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

  return {
    items: projectsWithPermissions,
    total: projectsWithPermissions.length,
    pageSize: params.pageSize,
    pageIndex: params.pageIndex,
  };
};
