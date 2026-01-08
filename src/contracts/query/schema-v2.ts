import z from 'zod';

const ZQueryFilter = z.object({
  type: z.enum(['user', 'workspace', 'project', 'sprint', 'issue']).optional(),
});

export const ZQueryParams = z.object({
  q: z.string().max(1000).optional().describe('The search query string.'),
  workspaceId: z.string().optional().describe('The workspace ID to search within.'),
  filter: ZQueryFilter.optional().describe('Optional filters to refine the search results.'),
  // pagination: z
  //   .object({
  //     cursor: z.string().optional().describe('The cursor for pagination.'),
  //     size: z.number().min(1).max(100).describe('The number of results to return.'),
  //   })
  //   .optional()
  //   .describe('Pagination parameters for the query.'),
});

export const ZQueryHit = z.object({
  id: z.string().describe('The unique identifier of the hit.'),
  index: z.string().describe('The index from which the hit was retrieved.'),
  type: z.string().describe('The type/category of the hit.'),
  score: z.number().describe('The relevance score of the hit.'),
  source: z.any().describe('The original document source of the hit.'),
  href: z.string().optional().describe('The URL of the hit.'),
});

export const ZQueryOutput = z.object({
  hits: z.array(ZQueryHit).describe('An array of search hits.'),
  meta: z.object({
    total: z.number().describe('The total number of hits matching the query.'),
    cursor: z.string().optional().describe('The cursor for fetching the next page of results.'),
  }),
  aggs: z.unknown().optional().describe('Optional aggregations related to the query.'),
  suggest: z.unknown().optional().describe('Optional suggestions for the query.'),
});

export type QueryHit = z.infer<typeof ZQueryHit>;
export type QueryParams = z.infer<typeof ZQueryParams>;
export type QueryOutput = z.infer<typeof ZQueryOutput>;
export type SearchInput = QueryParams;
export type SearchOutput = QueryOutput;
