import { ZMoveIssueInputV2 } from '@/contracts/boards/boards.input';
import { middlewareHandler } from '@/lib/http/api-handler';
import { boardsService } from '@/features/boards/server/service';
import { NextResponse } from 'next/server';

type Parsed =
  | { colId: string; type: 'top' | 'bottom' }
  | { colId: string; type: 'item'; itemId: string };

export function parseColPath(path: string): Parsed | null {
  const m = path.match(/^\/cols\/([^/]+)\/items\/([^/]+)$/);
  if (!m) return null;

  const colId = decodeURIComponent(m[1]);
  const tail = decodeURIComponent(m[2]);

  if (tail === 'top' || tail === 'bottom') return { colId, type: tail };
  return { colId, type: 'item', itemId: tail };
}

export const POST = middlewareHandler<{ boardId: string }>([], async (req) => {
  const body = await req.json();
  const params = req.params;
  const input = ZMoveIssueInputV2.parse(body);
  const fromParsed = parseColPath(input.from);
  const toParsed = parseColPath(input.to);
  if (!fromParsed || !toParsed)
    return NextResponse.json({ error: 'Invalid source item' }, { status: 400 });
  if (!('itemId' in fromParsed))
    return NextResponse.json({ error: 'Invalid source item' }, { status: 400 });
  let relative: { type: 'after' | 'before'; refId: string } | { type: 'top' | 'bottom' };
  if (toParsed.type === 'item') relative = { type: 'after', refId: toParsed.itemId };
  else relative = { type: toParsed.type };

  const result = await boardsService.moveIssue(
    { boardId: params.boardId, issueId: fromParsed.itemId },
    {
      parentType: 'column',
      relative,
      from: { parentId: fromParsed.colId },
      to: { parentId: toParsed.colId },
    },
  );
  return NextResponse.json(result);
});
