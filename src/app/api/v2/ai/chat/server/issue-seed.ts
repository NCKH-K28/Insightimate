import { prisma } from '@/lib/prisma';

export const seed = async () => {
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
  if (demoUser) return;
  await prisma.$transaction(
    async (tx) => {
      const users = [
        { id: 'user-demo', email: 'demo@example.com', name: 'Demo User' },
        { id: 'user-1', email: 'user1@example.com', name: 'User One' },
        { id: 'user-2', email: 'user2@example.com', name: 'User Two' },
        { id: 'user-3', email: 'user3@example.com', name: 'User Three' },
      ];

      await tx.user.createMany({ data: users });

      const perUser = async (id: string) => {
        return await tx.workspace.create({
          data: {
            id: `ws-${id}`,
            name: `Workspace of ${id}`,
            ownerId: id,
            members: { create: { id: `wm-${id}`, role: 'WS_ADMIN', userId: id } },
            projects: {
              create: {
                id: `proj-${id}`,
                name: `Project of ${id}`,
                key: `PROJ${id.slice(-1)}`,
                type: 'SOFTWARE',
                leadId: id,
                statuses: {
                  createMany: {
                    data: [
                      { id: `status-${id}-1`, name: `Status 1 for ${id}`, category: 'TODO' },
                      { id: `status-${id}-2`, name: `Status 2 for ${id}`, category: 'IN_PROGRESS' },
                      { id: `status-${id}-3`, name: `Status 3 for ${id}`, category: 'DONE' },
                    ],
                  },
                },
                priorities: {
                  createMany: {
                    data: [
                      { id: `priority-${id}-1`, name: 'Low' },
                      { id: `priority-${id}-2`, name: 'Medium' },
                      { id: `priority-${id}-3`, name: 'High' },
                    ],
                  },
                },
                resolutions: {
                  createMany: {
                    data: [
                      { id: `resolution-${id}-1`, name: 'Unresolved' },
                      { id: `resolution-${id}-2`, name: 'Fixed' },
                      { id: `resolution-${id}-3`, name: "Won't Fix" },
                    ],
                  },
                },
                types: {
                  createMany: {
                    data: [
                      { id: `type-${id}-1`, name: 'Bug' },
                      { id: `type-${id}-2`, name: 'Task' },
                      { id: `type-${id}-3`, name: 'Story' },
                    ],
                  },
                },
                issues: {
                  createMany: {
                    data: Array.from({ length: 30 }).map((_, index) => ({
                      id: `issue-${id}-${index + 1}`,
                      key: `ISSUE-${id}-${index + 1}`,
                      summary: `Issue ${index + 1} for ${id}`,
                      description: `This is the description for issue ${
                        index + 1
                      } created by ${id}.`,
                      assigneeId: ['user-1', 'user-2', 'user-3', null][index % 4],
                      statusId: `status-${id}-${(index % 3) + 1}`,
                      priorityId: `priority-${id}-${((index + 1) % 3) + 1}`,
                      resolutionId: `resolution-${id}-${((index + 1) % 3) + 1}`,
                      typeId: `type-${id}-${((index + 2) % 3) + 1}`,
                    })),
                  },
                },
              },
            },
          },
        });
      };

      await Promise.all(users.map((u) => perUser(u.id)));
    },
    { timeout: 30000 },
  );
};
