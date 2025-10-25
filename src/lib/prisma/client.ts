import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { withTrigger } from './extensions/trigger-extension';

const ZPrismaConfig = z.object({ DATABASE_URL: z.string().min(1) });

const prismaConfig = ZPrismaConfig.parse(process.env);

const getGlobalPrisma = () => {
  const globalForPrisma = globalThis as unknown as any;
  const { prisma } = globalForPrisma;
  if (prisma) return prisma as typeof client;

  const client = new PrismaClient({
    datasources: { db: { url: prismaConfig.DATABASE_URL } },
  }).$extends(
    withTrigger({
      connectionString: prismaConfig.DATABASE_URL,
      models: {
        Project: {
          channel: 'project_changes',
          model: 'projects',
          operations: { insert: true, update: true, delete: true },
        },
      },
    }),
  );

  Object.assign(globalForPrisma, { prisma: client });
  return client;
};

export const prisma = getGlobalPrisma();

// health check
const healthCheck = async () => await prisma.$queryRaw`SELECT 1`;
await healthCheck().catch((err) => {
  console.error('Prisma health check failed:', err);
  process.exit(1);
});
