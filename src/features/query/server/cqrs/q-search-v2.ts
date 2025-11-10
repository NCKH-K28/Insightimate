 

import { elasticClient, SearchQuery } from '@/lib/elastic';
import { QueryOutput, QueryParams, ZQueryOutput } from '@/contracts/query/schema-v2';

import { listAccessibleResources } from '@/features/authz/server/cqrs/q-allowed-objects';

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

export const buildQuery = async (
  input: QueryParams,
  context: { actorId: string },
): Promise<SearchQuery> => {
  const q = input.q.trim();

  let baseQuery: SearchQuery = { match_all: {} };

  if (q !== '') {
    baseQuery = {
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

  const workspaceIds = await listAccessibleResources({
    action: 'can_view',
    subject: { type: 'user', id: context.actorId },
    resource: { type: 'workspace' },
  });
  const projectIds = await listAccessibleResources({
    action: 'can_view',
    subject: { type: 'user', id: context.actorId },
    resource: { type: 'project' },
  });

  // Build authorization filters
  const authShould: SearchQuery[] = [];
  authShould.push({
    bool: {
      must_not: [
        { exists: { field: 'owner_id' } },
        { exists: { field: 'project_id' } },
        { exists: { field: 'workspace_id' } },
      ],
    },
  });
  authShould.push({ term: { owner_id: context.actorId } });
  authShould.push({ terms: { project_id: projectIds } });
  authShould.push({ terms: { workspace_id: workspaceIds } });

  return {
    bool: {
      must: [baseQuery],
      should: authShould,
      minimum_should_match: 1,
    },
  };
};

export const search = async (
  input: QueryParams,
  context: { actorId: string },
): Promise<QueryOutput> => {
  const query = await buildQuery(input, context);

  const searchResult = await elasticClient.search({
    index: '_all',
    query,
    sort: [{ _score: { order: 'desc' } }],
    _source: {
      excludes: [
        'embedding',
        'embedding_raw',
        'full_text',
        //
      ],
    },
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
