import { elasticClient, SearchQuery } from '@/lib/elastic';
import { QueryOutput, QueryParams, ZQueryOutput } from '@/contracts/query/schema-v2';

const toCamelKey = (k: string) =>
  k.replace(/^_+/, '').replace(/[_-]([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());

export const keysToCamel = (input: any): any => {
  if (Array.isArray(input)) return input.map(keysToCamel);
  if (input && typeof input === 'object' && input.constructor === Object) {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [toCamelKey(k), keysToCamel(v)]),
    );
  }
  return input;
};

type ElasticSearchHit = {
  _index?: string;
  _id?: string;
  _source?: unknown;
  _score?: number | null;
};
const tableToTypeMap: Record<string, string> = {
  users: 'user',
  workspaces: 'workspace',
  projects: 'project',
  sprints: 'sprint',
  issues: 'issue',
};

const formatHit = <T extends ElasticSearchHit>(hit: T): QueryOutput['hits'][0] => {
  return {
    score: hit._score || 0,
    index: hit._index || 'unknown',
    id: hit._id || 'unknown',
    type: tableToTypeMap[hit._index || ''] || 'unknown',
    source: keysToCamel(hit._source || {}),
  };
};

export const search = async (
  input: QueryParams,
  context?: { actorId: string },
): Promise<QueryOutput> => {
  const q = input.q.trim();

  let query: SearchQuery = {};

  if (q === '') {
    query = { match_all: {} };
  } else {
    query = {
      bool: {
        should: [
          {
            multi_match: {
              query: q,
              type: 'best_fields',
              fields: ['summary^3', 'description', 'name^2', 'bio', 'fullName^2'],
              fuzziness: 'AUTO',
              operator: 'and',
              tie_breaker: 0.2,
            },
          },
          {
            multi_match: {
              query: q,
              type: 'phrase_prefix',
              fields: ['summary^2', 'name^2', 'fullName^2', 'description', 'bio'],
              slop: 2,
            },
          },
        ],
      },
    };
  }

  const searchResult = await elasticClient.search({
    index: '_all',
    query,
    sort: [{ _score: { order: 'desc' } }],
    // size: input.pagination?.size || 25,
    // search_after: input.pagination?.cursor ? [input.pagination.cursor] : undefined,
  });

  const hits = searchResult.hits.hits.map(formatHit);
  const result: QueryOutput = {
    hits,
    meta: { total: hits.length, cursor: undefined },
  };

  return ZQueryOutput.parse(result);
};
