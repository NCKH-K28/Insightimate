import z from 'zod';
import { arrayToEnum } from '@/lib/utils/enum';

export const RESOURCE_TYPE = arrayToEnum(['project', 'board', 'sprint', 'issue']);

export const ZResourceEnum = z.enum(Object.values(RESOURCE_TYPE));

const ZSort = z.any(); // IGNORE
const ZFacet = z.any(); // IGNORE

export const ZSearchFilter = z.object({
  types: z.array(ZResourceEnum).optional(),
  facets: z.array(ZFacet).optional(),
});

export const ZSearchPagination = z.object({
  cursor: z.string().optional(),
  size: z.coerce.number().min(1).max(100).optional(),
});

const ZBreadcrumb = z.object({ id: z.string(), label: z.string(), href: z.string().optional() });

export const ZSearchItem = z.object({
  id: z.string(), // `${type}:${id}`
  type: ZResourceEnum,
  title: z.string(),
  description: z.string().optional(),
  breadcrumbs: z.array(ZBreadcrumb).optional(),
  snippet: z.string().optional(),
  url: z.string().optional(),
  iconURL: z.string().optional(),

  // == Resource specific data ==
  issue: z.unknown().optional(),
  project: z.unknown().optional(),
  board: z.unknown().optional(),
  sprint: z.unknown().optional(),
});

export const ZSearchInput = z.object({
  q: z.string().min(1).max(255),
  filter: ZSearchFilter.optional(),
  pagination: ZSearchPagination.optional(),
  sort: ZSort.optional(),
});

export const ZSearchOutput = z.object({
  data: z.array(ZSearchItem),
  meta: z.object({ total: z.number(), cursor: z.string().optional() }),
});

export type SearchInput = z.infer<typeof ZSearchInput>;
export type SearchOutput = z.infer<typeof ZSearchOutput>;
