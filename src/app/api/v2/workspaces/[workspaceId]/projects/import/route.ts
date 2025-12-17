import { ProjectImport, ZProjectImportWithLogic } from '@/contracts/projects';
import {
  genIssueId,
  genIssuePriorityId,
  genIssueStatusId,
  genIssueTypeId,
  genProjectId,
  genProjectRoleId,
} from '@/features/projects/configs/id-generators';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const importProjectToWs = (workspaceId: string, input: ProjectImport) => {
  prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const project = await tx.project.create({
      data: {
        id: genProjectId(),
        workspaceId,
        key: input.key,
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        leadId: input.leadId,
        type: 'SOFTWARE',
        issues: {
          createMany: {
            data: input.issues.map((i, idx) => ({
              ...i,
              id: genIssueId(),
              key: `${input.key}-${idx + 1}`,
            })),
          },
        },
        roles: { createMany: { data: input.roles.map((r) => ({ ...r, id: genProjectRoleId() })) } },
        types: { createMany: { data: input.types.map((t) => ({ ...t, id: genIssueTypeId() })) } },
        priorities: {
          createMany: { data: input.priorities.map((p) => ({ ...p, id: genIssuePriorityId() })) },
        },
        statuses: {
          createMany: { data: input.statuses.map((s) => ({ ...s, id: genIssueStatusId() })) },
        },
      },
    });
  });
};

export const GET = compose<{ workspaceId: string }>(
  zodBodyPipe(ZProjectImportWithLogic),
  async (req) => {
    const { workspaceId } = req.params;

    const input = getZodBody(req, ZProjectImportWithLogic);

    //

    return NextResponse.json({ workspaceId, input });
  },
);
