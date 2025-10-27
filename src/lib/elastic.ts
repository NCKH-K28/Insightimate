import { ClientOptions } from '@elastic/elasticsearch';

async function createElasticSearchClient(options: ClientOptions) {
  const { Client } = await import('@elastic/elasticsearch');

  return new Client(options);
}

const DEFAULTS: ClientOptions = {
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'E8NqMYnEJa1IJY7ZZU6TgM2V',
  },
};

export function getElasticClient() {
  return createElasticSearchClient(getElasticOptions());
}

function getElasticOptions(): ClientOptions {
  // this branch is for dev
  return {
    node: DEFAULTS.node,
  };
}
