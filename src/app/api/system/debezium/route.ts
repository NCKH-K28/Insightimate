// src/app/api/system/debezium/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { elasticClient } from '@/lib/elastic';
import { compose } from '@/lib/http/api-compose';
import { elasticsearchSinkConfig, postgresSourceConfig } from '@/lib/debezium/connectors';
import { debezium } from '@/lib/debezium';
import { prisma } from '@/lib/prisma';

const runDebeziumSeed = async () => {
  // clear elasticsearch indexes
  await elasticClient.deleteByQuery({ index: '_all', query: { match_all: {} } });

  // seed debezium connectors
  const connectors = [postgresSourceConfig, elasticsearchSinkConfig];
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
};

export const GET = compose(async () => {
  const result = await runDebeziumSeed();

  return NextResponse.json(
    { ok: true, result, message: 'Debezium connectors seeded successfully' },
    { status: 200 },
  );
});
