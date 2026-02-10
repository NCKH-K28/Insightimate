import { CreateProjectParams, TxClient } from '@/features/project/server/types';
import { genBoardId, genColumnId, genSprintId } from './id-generators';

export const createDefaultBoard = async (
  tx: TxClient,
  params: CreateProjectParams & { issues?: { id: string }[] },
) => {
  const { projectId, projectLeadId, inputKey, statuses } = params;
  const { sprintCounter } = await tx.project.update({
    where: { id: projectId },
    data: { sprintCounter: { increment: 1 } },
    select: { sprintCounter: true },
  });

  const boardIssues = params.issues?.map((issue) => ({ issueId: issue.id, rank: 0 })) || [];
  return tx.board.create({
    data: {
      id: genBoardId(),
      type: 'SCRUM',
      ownerId: projectLeadId,
      name: `${inputKey} Board`,
      projectId,

      issues: { createMany: { data: boardIssues } },
      columns: {
        create: statuses.map((status, index) => ({
          id: genColumnId(),
          name: status.name,
          sequence: index,
          statuses: { create: { statusId: status.id } },
        })),
      },
      sprints: {
        create: {
          id: genSprintId(),
          name: `Sprint ${sprintCounter}`,
          sequence: 0,
          state: 'FUTURE',
        },
      },
    },
  });
};
