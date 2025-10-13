import { genBoardId, genColumnId, genSprintId } from './id-generators';
import { TxClient, CreateProjectParams } from '../project/types';

export const createDefaultBoard = async (tx: TxClient, params: CreateProjectParams) => {
  const { projectId, projectLeadId, inputKey, statuses } = params;

  const { sprintCounter } = await tx.project.update({
    where: { id: projectId },
    data: { sprintCounter: { increment: 1 } },
    select: { sprintCounter: true },
  });

  return tx.board.create({
    data: {
      id: genBoardId(),
      type: 'SCRUM',
      ownerId: projectLeadId,
      name: `${inputKey} Board`,
      projectId,
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
