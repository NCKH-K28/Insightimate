// import hono
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { backfillIssues } from '@/features/agents/server/ai-service';
import { elasticsearchSinkConfig, postgresSourceConfig } from '@/lib/debezium/connectors';
import { elasticClient } from '@/lib/elastic';
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

// ============ APIs ============

const systemRoute = new Hono().basePath('/api/system');

systemRoute.get('/backfill-issues', async (c) => {
  const query = c.req.query();
  const fetchSize = query.fetchSize ? parseInt(query.fetchSize as string, 10) : 200;
  const maxDocs = query.maxDocs ? parseInt(query.maxDocs as string, 10) : 500;

  const result = await backfillIssues({ fetchSize, maxDocs });

  return c.json(
    {
      ok: true,
      processed: result.processed,
      fetchSize,
      maxDocs,
      message: 'Backfill finished for this batch.',
    },
    { status: 200 },
  );
});

systemRoute.get('/debezium', async (c) => {
  await runDebeziumSeed();
  return c.json({ ok: true, message: 'Debezium seed finished' }, { status: 200 });
});

export const GET = handle(systemRoute);
export const POST = handle(systemRoute);
export const PUT = handle(systemRoute);
export const PATCH = handle(systemRoute);
