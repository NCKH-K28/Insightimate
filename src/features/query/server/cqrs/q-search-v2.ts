import { elasticClient, SearchQuery } from '@/lib/elastic';
import { QueryOutput, QueryParams, ZQueryOutput } from '@/contracts/query/schema-v2';

import { listAccessibleResources } from '@/features/authz/server/cqrs/q-allowed-objects';
import { prisma } from '@/lib/prisma';

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
  const q = input.q?.trim() || '';

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

  let workspaceIds = await listAccessibleResources({
    action: 'can_view',
    subject: { type: 'user', id: context.actorId },
    resource: { type: 'workspace' },
  });
  let projectIds = await listAccessibleResources({
    action: 'can_view',
    subject: { type: 'user', id: context.actorId },
    resource: { type: 'project' },
  });

  if (input.workspaceId && workspaceIds.includes(input.workspaceId)) {
    workspaceIds = [input.workspaceId];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds }, workspaceId: input.workspaceId },
    });
    projectIds = projects.map((p) => p.id);
  }

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
  authShould.push({
    terms: { workspace_id: input.workspaceId ? [input.workspaceId] : workspaceIds },
  });

  return {
    bool: {
      must: [baseQuery],
      should: authShould,
      minimum_should_match: 1,
    },
  };
};

const typeToIndexMap: Record<string, string> = {
  user: 'users',
  workspace: 'workspaces',
  project: 'projects',
  sprint: 'sprints',
  issue: 'issues',
};

export const search = async (
  input: QueryParams,
  context: { actorId: string },
): Promise<QueryOutput> => {
  const query = await buildQuery(input, context);

  let index = '_all';
  if (input.filter?.type) index = typeToIndexMap[input.filter.type] || '_all';

  const searchResult = await elasticClient.search({
    index,
    query,
    sort: [{ _score: { order: 'desc' } }],
    _source: { excludes: ['embedding', 'embedding_raw', 'full_text'] },
    // size: input.pagination?.size || 25,
    // search_after: input.pagination?.cursor ? [input.pagination.cursor] : undefined,
  });

  const hits = searchResult.hits.hits.map(formatHit);

  const projecIds = hits.filter((hit) => hit.type === 'issue').map((hit) => hit.source.projectId);
  const types = await prisma.issueType.findMany({ where: { projectId: { in: projecIds } } });
  const typeMap = new Map(types.map((t) => [t.id, t.iconURL]));

  const hitWithHref = hits.map((hit) => {
    switch (hit.index) {
      case 'issues':
        const iconURL = typeMap.get(hit.source.typeId);
        return {
          ...hit,
          href: `/projects/${hit.source.projectId}/issues/${hit.source.id}`,
          source: { ...hit.source, iconURL },
        };
      case 'projects':
        return { ...hit, href: `/projects/${hit.source.id}` };
      default:
        return hit;
    }
  });

  const result: QueryOutput = {
    hits: hitWithHref,
    meta: { total: hitWithHref.length, cursor: undefined },
  };

  return ZQueryOutput.parse(result);
};
