// index task
import { prisma } from '@/lib/prisma';
import { openai } from './openai';
import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import pgvector from 'pgvector';

const model = 'text-embedding-3-small';

const genEmbeddingId = () => `em_${createId()}`;

const genIssuesSeed = async () => {
  const u = await prisma.user.upsert({
    where: { email: 'system@localhost' },
    create: { id: 'user_system', email: 'system@localhost', name: 'System User' },
    update: {},
  });
  if (!u) throw new Error('No user found for seeding issues');
  const count = 100;
  await prisma.workspace.upsert({
    where: { id: 'ws_seed' },
    create: {
      id: 'ws_seed',
      name: 'Seed Workspace',
      ownerId: u.id,
      projects: {
        create: {
          id: 'prj_seed',
          key: 'SEED',
          name: 'Seed Project',
          leadId: u.id,
          type: 'SOFTWARE',
          statuses: { create: [{ id: 'status_todo', name: 'To Do', category: 'TODO' }] },
          types: { create: [{ id: 'type_task', name: 'Task' }] },
          priorities: { create: [{ id: 'priority_medium', name: 'Medium' }] },
          issues: {
            createMany: {
              data: Array.from({ length: count }).map((_, i) => ({
                id: `issue_seed_${i + 1}`,
                key: `SEED-${i + 1}`,
                summary: `This is a summary of seed issue ${i + 1}`,
                description: `This is a detailed description of seed issue ${
                  i + 1
                }. It contains more information about the issue for testing purposes.`,
                reporterId: u.id,
                assigneeId: u.id,
                statusId: 'status_todo',
                typeId: 'type_task',
                priorityId: 'priority_medium',
              })),
            },
          },
        },
      },
    },
    update: {},
  });
};

await genIssuesSeed();

async function embedBatch(chunks: string[]) {
  const resp = await openai.embeddings.create({
    model: model,
    input: chunks,
    dimensions: 1536,
  });
  return resp.data.map((d) => d.embedding);
}

export const indexIssues = async () => {
  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);

  const rows = await prisma.issue.findMany({
    select: { id: true, summary: true, description: true },
    where: { updatedAt: { gte: oneDayAgo } },
  });

  const batch = 20;

  console.time(`processing-batch`);
  console.timeLog('processing-batch', `Total rows to process: ${rows.length}`);

  let completed = 0;
  try {
    for (let i = 0; i < rows.length; i += batch) {
      const batchRows = rows.slice(i, i + batch);
      const embeddings = await embedBatch(
        batchRows.map((row) => [row.summary, row.description].filter(Boolean).join('\n')),
      );

      await Promise.all(
        embeddings
          .map((embedding, indx) => {
            const row = batchRows[indx];
            const vector = pgvector.toSql(embedding);
            return { row, vector };
          })
          .map(async ({ row, vector }) => {
            const text = [row.summary, row.description].filter(Boolean).join('\n');
            await prisma.aIEmbedding.upsert({
              where: { unique_resource_embedding: { resourceType: 'ISSUE', resourceId: row.id } },
              create: {
                id: genEmbeddingId(),
                ownerId: 'system',
                text,
                url: `/issues/${row.id}`,
                resourceType: 'ISSUE',
                resourceId: row.id,
              },
              update: { text, url: `/issues/${row.id}` },
            });

            await prisma.$executeRaw`
            UPDATE "AIEmbedding"
            SET vector = ${vector}::vector
            WHERE "resourceType" = 'ISSUE' AND "resourceId" = ${row.id}
          `;
          }),
      );

      completed++;
      console.timeLog(
        'processing-batch',
        `Completed batch ${completed} / ${Math.ceil(rows.length / batch)}`,
      );
    }
  } catch (error) {
    console.timeLog('processing-batch', `Error occurred after processing ${completed} batches`);
    console.error('Error during indexing issues:', error);
  }

  console.timeEnd('processing-batch');
  if (rows.length === 0) return { success: true, indexed: 0 };
  if (completed === 0) return { success: false, indexed: 0 };
  if (completed < Math.ceil(rows.length / batch))
    return { success: false, indexed: completed * batch };
  return { success: true, indexed: rows.length };
};

export const searchIssues = async (query: string, userId: string) => {
  const embeddingResp = await openai.embeddings.create({
    model: model,
    input: query,
    dimensions: 1536,
  });

  const queryEmbedding = embeddingResp.data[0].embedding;

  const vector = pgvector.toSql(queryEmbedding);

  const results = await prisma.$queryRaw<
    { id: string; resourceType: string; resourceId: string; score: number }[]
  >`
    SELECT "id", "resourceType", "resourceId", 1 - (vector <=> ${vector}::vector) AS score
    FROM "AIEmbedding"
    WHERE "ownerId" = ${userId} AND "resourceType" = 'ISSUE'
    ORDER BY vector <=> ${vector}::vector
    LIMIT 15
  `;

  return results;
};
