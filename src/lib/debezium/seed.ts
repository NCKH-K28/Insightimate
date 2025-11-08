import { debezium } from './client';
import { elasticsearchSinkConfig, postgresSourceConfig } from './connectors';
import { prisma } from '@/lib/prisma';

const connectors = [postgresSourceConfig, elasticsearchSinkConfig];

export const seedDebeziumConnectors = async () => {
  const results = [];

  for (const connector of connectors) {
    try {
      await debezium.update({
        name: connector.name,
        config: { ...connector.config, 'snapshot.mode': 'initial' },
      });
      results.push(`[${connector.name}] Connector updated`);
    } catch (error) {
      console.warn(`Failed to update connector [${connector.name}]:`, error);
      await debezium.delete(connector.name).finally(() => debezium.create(connector));
      results.push(`[${connector.name}] Connector created`);
    }
  }

  await prisma.debeziumSignal.create({
    data: {
      id: `debezium-snapshot-${Date.now()}`,
      type: 'execute-snapshot',
      data: {
        'data-collections': [
          'public.users',
          'public.workspaces',
          'public.projects',
          'public.issues',
        ],
        type: 'INCREMENTAL',
      },
    },
  });

  return results;
};
