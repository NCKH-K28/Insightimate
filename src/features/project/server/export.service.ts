import { ZIssue, ZIssuePriority, ZIssueStatus, ZIssueType } from '@/contracts/issues';
import { ZProjectRole } from '@/contracts/project';
import { prisma } from '@/lib/prisma';
import z from 'zod';
import { projectsService } from './projects.service';

const ZProjectExport = z.object({
  metadata: z.any(),
  project: z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    avatar: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    leadId: z.string(),

    // === Related Data ===
    actors: z
      .object({ actorId: z.string(), actorType: z.enum(['USER']), roleId: z.string() })
      .array(),
    roles: ZProjectRole.omit({ projectId: true }).array(),
    types: ZIssueType.omit({ projectId: true }).array(),
    priorities: ZIssuePriority.omit({ projectId: true }).array(),
    statuses: ZIssueStatus.omit({ projectId: true }).array(),
    issues: ZIssue.omit({ projectId: true }).array(),
  }),
});
type ProjectExport = z.infer<typeof ZProjectExport>;

const exportProject = async (
  projectId: string,
  ctx: { actorId: string },
): Promise<ProjectExport> => {
  // Authorization check
  await projectsService.getById(projectId, ctx);

  const { project, teams } = await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        actors: true,
        roles: true,
        types: true,
        priorities: true,
        statuses: true,
        issues: true,
      },
    });

    const teamIds = project.actors.filter((a) => a.actorType === 'TEAM').map((a) => a.actorId);

    const teams = teamIds.length
      ? await tx.team.findMany({ where: { id: { in: teamIds } }, include: { memberships: true } })
      : [];

    return { project, teams };
  });

  // format actors
  const userActors = project.actors.filter((a) => a.actorType === 'USER');
  const teamActors = project.actors.filter((a) => a.actorType === 'TEAM');

  type ActorRow = (typeof project.actors)[number] & { actorType: 'USER' };
  const actorsMap = new Map<string, ActorRow>();

  for (const a of userActors) {
    actorsMap.set(a.actorId, { ...a, actorType: 'USER' });
  }

  const teamMaps = new Map(teams.map((t) => [t.id, t]));
  for (const teamActor of teamActors) {
    const team = teamMaps.get(teamActor.actorId);
    if (!team) continue;

    for (const member of team.memberships) {
      if (!actorsMap.has(member.userId)) {
        actorsMap.set(member.userId, { ...teamActor, actorType: 'USER', actorId: member.userId });
      }
    }
  }

  const actors = Array.from(actorsMap.values());

  const exportData: ProjectExport = {
    metadata: { schemaVersion: 'project-export/v1', exportedAt: new Date().toISOString() },
    project: {
      ...project,
      id: project.id,
      name: project.name,
      description: project.description,
      avatar: project.avatar,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      leadId: project.leadId,
      roles: ZProjectRole.omit({ projectId: true }).array().parse(project.roles),
      actors: actors,
      types: project.types,
      priorities: project.priorities,
      statuses: project.statuses,
      issues: ZIssue.array().parse(project.issues),
    },
  };

  const valid = ZProjectExport.parse(exportData);
  return valid;
};

export const exportService = {
  exportProject,
};
