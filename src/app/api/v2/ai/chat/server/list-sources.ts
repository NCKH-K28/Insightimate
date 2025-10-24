import { z } from 'zod';

const ZSourceFilter = z.object({
  q: z.string().min(1).optional().describe('Keyword search in source name or description'),
  sourceIds: z.array(z.string()).min(1).optional().describe('Filter by source IDs'),
  workspaceId: z.string().optional().describe('Filter by workspace ID'),
});

const ZPagination = z.object({
  take: z.number().int().min(1).max(50).default(20).optional(),
  cursor: z.string().optional().describe('Cursor ID for pagination'),
});

export const ZQueryParams = z.object({
  filter: ZSourceFilter.optional(),
  pagination: ZPagination.optional(),
});

type QueryParams = z.infer<typeof ZQueryParams>;

export const listSources = async (input: QueryParams) => {
  //
  return { data: [] };
};
