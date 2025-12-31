import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { ZColumnReorderInput } from '@/contracts/boards/board.input';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = compose<{ boardId: string }>(zodBodyPipe(ZColumnReorderInput), async (req) => {
  const { boardId } = req.params;
  const input = getZodBody(req, ZColumnReorderInput);

  await prisma.$transaction(async (tx) => {
    const board = await tx.board.findUnique({ where: { id: boardId } });
    if (!board) throw new Error('Board not found');

    const inputIdSet = new Set(input.ids);

    const columns = await tx.boardColumn.findMany({ where: { boardId } });
    columns.forEach((col) => inputIdSet.add(col.id));
    const nextIds = Array.from(inputIdSet);
    await Promise.all(
      nextIds.map((id, index) =>
        tx.boardColumn.update({ where: { id, boardId }, data: { sequence: index } }),
      ),
    );
  });
});
