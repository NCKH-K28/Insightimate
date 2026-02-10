import { ZColumnUpdatePatchInput } from '@/contracts/boards/column.input';
import { genIssueStatusId } from '@/features/project/configs/id-generators';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const DELETE = compose<{ boardId: string; columnId: string }>(async (req) => {
  const { boardId, columnId } = req.params;
  await prisma.$transaction(async (tx) => {
    const board = await tx.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NextResponse('Board not found', { status: 404 });
    const column = await tx.boardColumn.findUnique({ where: { id: columnId, boardId } });
    if (!column) throw new NextResponse('Column not found', { status: 404 });
    // await tx.boardColumn.delete({ where: { id: columnId, boardId } });
    // disconect to status
    await tx.boardColumn.update({ where: { id: columnId }, data: { statuses: { set: [] } } });
  });

  return NextResponse.json({ columnId });
});

export const PATCH = compose<{ boardId: string; columnId: string }>(
  zodBodyPipe(ZColumnUpdatePatchInput),
  async (req) => {
    const { boardId, columnId } = req.params;
    const { patches } = getZodBody(req, ZColumnUpdatePatchInput);

    const result = await prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId },
        include: { project: true },
      });
      if (!board) throw new Error(`Board not found: ${boardId}`);
      const projectId = board.project.id;
      if (!projectId) throw new Error(`Project not found: ${projectId}`);

      const column = await tx.boardColumn.findUnique({
        where: { id: columnId },
        select: { id: true },
      });
      if (!column) throw new Error(`Column not found: ${columnId}`);

      let nextName: string | undefined;
      const addStatuses: Array<{
        id?: string;
        name: string;
        color?: string;
        iconURL?: string;
        category: 'TODO' | 'IN_PROGRESS' | 'DONE';
      }> = [];

      const removeStatusIds: string[] = [];

      for (const p of patches) {
        if ((p.op === 'add' || p.op === 'replace') && p.path === '/name') {
          nextName = p.value;
          continue;
        }

        if (p.op === 'add' && p.path === '/statuses') {
          addStatuses.push(p.value);
          continue;
        }

        if (p.op === 'remove' && p.path.startsWith('/statuses/')) {
          // p.path dạng: /statuses/<id>
          const statusId = p.path.split('/')[2];
          removeStatusIds.push(statusId);
          continue;
        }

        // hiếm khi tới đây vì Zod đã chặn
        throw new Error(`Unsupported patch: ${JSON.stringify(p)}`);
      }

      // 1) update name (nếu có)
      if (nextName !== undefined) {
        await tx.boardColumn.update({
          where: { id: columnId },
          data: { name: nextName },
        });
      }

      // 2) remove connect: chỉ xoá join row ColumnStatus
      for (const statusId of removeStatusIds) {
        // Nếu bạn có @@unique([columnId, statusId]) đặt tên là columnId_statusId:
        const deleted = await tx.columnStatus.deleteMany({
          where: { columnId, statusId },
        });

        // JSON Patch thường “remove cái không tồn tại” là lỗi; tuỳ bạn muốn strict hay not.
        if (deleted.count === 0) {
          throw new Error(`Status not connected to column (cannot remove): ${statusId}`);
        }
      }

      // 3) add: tạo status + tạo connect (ColumnStatus)
      for (const s of addStatuses) {
        // tạo status (hoặc upsert nếu client có đưa id)
        const status = s.id
          ? await tx.issueStatus.upsert({
              where: { id: s.id },
              update: {
                name: s.name,
                color: s.color ?? undefined,
                iconURL: s.iconURL ?? undefined,
                category: s.category,
              },
              create: {
                id: s.id,
                name: s.name,
                color: s.color ?? undefined,
                iconURL: s.iconURL ?? undefined,
                category: s.category,
                projectId,
              },
            })
          : await tx.issueStatus.create({
              data: {
                id: genIssueStatusId(),
                name: s.name,
                color: s.color ?? undefined,
                iconURL: s.iconURL ?? undefined,
                category: s.category,
                projectId,
              },
            });

        await tx.columnStatus.upsert({
          where: { columnId_statusId: { columnId, statusId: status.id } },
          update: {},
          create: { columnId, statusId: status.id },
        });
      }

      return tx.boardColumn.findUnique({
        where: { id: columnId },
        include: { statuses: { include: { status: true } } },
      });
    });

    return NextResponse.json(result);
  },
);
