// app/api/v2/boards/[boardId]/issues:metrics

import { authenticated } from '@/lib/auth';
import { middlewareHandler } from '@/lib/http/api-handler';

export const GET = middlewareHandler([authenticated], async (req, res) => {
  throw new Error('Not implemented');
});
