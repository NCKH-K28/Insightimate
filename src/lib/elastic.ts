import { ClientOptions, Client } from '@elastic/elasticsearch';
import get from 'lodash/get';
import set from 'lodash/set';

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const DEFAULTS: ClientOptions = {
  node: ELASTICSEARCH_NODE,
  headers: {
    accept: 'application/vnd.elasticsearch+json; compatible-with=8',
    'content-type': 'application/vnd.elasticsearch+json; compatible-with=8',
  },
};

const getElastic = () => {
  const elastic = get(globalThis, '__INSIGHTIMATE_ELASTIC__', null);
  if (elastic) return elastic;
  const client = new Client(DEFAULTS);
  set(globalThis, '__INSIGHTIMATE_ELASTIC__', client);
  return client;
};

export const elasticClient = getElastic();

export type SearchRequest = Extract<Parameters<Client['search']>[0], object>;
export type SearchQuery = Extract<SearchRequest['query'], object>;
