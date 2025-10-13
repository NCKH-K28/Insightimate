import { createId as generateCuid2 } from '@paralleldrive/cuid2';
import { prisma } from '@/lib/prisma';
import { templateConfigs } from './template';
import { ProjectCreateInput } from '@/contracts/projects';

export default async function createProject(
  ctx: { userId: string; template: 'SCRUM' | 'KANBAN' },
  input: ProjectCreateInput,
) {
  // FIXME
  if (ctx.template !== 'SCRUM') throw new Error('Chưa xử lý trường hợp template khác SCRUM');
  // ==

  const templateConfig = templateConfigs[ctx.template];

  return await prisma.$transaction(
    async (tx) => {
      const { userId } = ctx;
      const workspaceId = input.workspaceId;
      const key = input.key;

      const pkeyExists = await tx.project.findUnique({
        where: { workspaceId_key: { workspaceId, key: input.key } },
      });

      if (pkeyExists) throw new Error(`Project key "${key}" already exists`);

      const priorities =
        templateConfig.priorities?.map((p) => ({ ...p, id: `priority_${generateCuid2()}` })) || [];
      const statuses =
        templateConfig.statuses?.map((s) => ({ ...s, id: `status_${generateCuid2()}` })) || [];
      const types =
        templateConfig.types?.map((t) => ({ ...t, id: `type_${generateCuid2()}` })) || [];
      const resolutions =
        templateConfig.resolutions?.map((r) => ({ ...r, id: `resolution_${generateCuid2()}` })) ||
        [];

      const roles = input.roles?.map((r) => ({ ...r, id: `role_${generateCuid2()}` }));

      const project = await tx.project.create({
        data: {
          ...input,
          id: `pr_${generateCuid2()}`,
          type: input.type || 'SOFTWARE',
          priorities: { create: priorities },
          statuses: { create: statuses },
          types: { create: types },
          resolutions: { create: resolutions },
          roles: { createMany: { data: roles ?? [] } },

          board: {
            create: {
              id: `brd_${generateCuid2()}`,
              type: 'SCRUM',
              ownerId: userId,
              name: `${key} Board`,
              columns: {
                create: statuses.map((status, index) => ({
                  id: `column_${generateCuid2()}`,
                  name: status.name,
                  sequence: index,
                  statuses: { create: { statusId: status.id } },
                })),
              },

              sprints: {
                create: {
                  id: `sprint_${generateCuid2()}`,
                  sequence: 0,
                  name: `${key} Sprint 1`,
                  state: 'FUTURE',
                  goal: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },

              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },

          leadId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),

          // === internal ===
          issueCounter: 0,
          sprintCounter: 0,
          // ===
        },
      });

      // ===== CORE: permission and project
      // const defaultPermissions = getDefaultPermissionSchemes();
      // const defaultPerm = defaultPermissions['Software Project'];
      // const permissionSchema = await tx.permissionSchema.create({
      //   data: {
      //     name: `PS-${key}`,
      //     permissions: { create: defaultPerm },
      //     project: {
      //       create: {
      //         ...input,
      //         roleActors: {
      //           create: [{ roleType: 'USER', roleParam: userId, projectRole: 'ADMIN' }],
      //         },
      //         statuses: { create: templateConfig.statuses },
      //         types: { create: templateConfig.types },
      //         priorities: { create: templateConfig.priorities },
      //         resolutions: { create: templateConfig.resolutions },
      //         createdAt: new Date(),
      //         updatedAt: new Date(),
      //         ownerId: userId,
      //         type: input.type || 'SOFTWARE',
      //         // === internal ===
      //         issueCounter: 0,
      //         sprintCounter: 0,
      //         // ===
      //       },
      //     },
      //   },
      //   include: { project: { include: { statuses: true } } },
      // });
      // const project = permissionSchema.project;
      // if (!project) throw new Error('Project creation failed');
      // else console.log(`Project created with ID: ${project.id}`);
      // ===========================

      // // ===========================
      // // SCRUM BOARD SETUP
      // // ===========================
      // const projectId = project.id;
      // const projectKey = project.key;
      // const projectName = project.name;
      // const issueStatuses = project.statuses;

      // const boardColumns: Prisma.BoardCreateInput['columns'] = {
      //   create: issueStatuses.map((status, index) => ({
      //     name: status.name,
      //     sequence: index,
      //     statuses: { create: { statusId: status.id } },
      //   })),
      // };

      // const scrumBoard = await tx.board.create({
      //   data: {
      //     name: `${projectKey} Board`,
      //     description: `Scrum board for ${projectName}`,
      //     type: 'SCRUM',
      //     projectId,
      //     ownerId: userId,
      //     columns: boardColumns,
      //     sprints: { create: [{ sequence: 0, name: `${projectKey} Sprint 1`, state: 'FUTURE' }] },
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //   },
      // });
      // console.log(`Board created with ID: ${scrumBoard.id}`);

      // const createdProject = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      // return createdProject;

      return project;
    },
    { isolationLevel: 'Serializable', timeout: 10000, maxWait: 5000 },
  );
}
