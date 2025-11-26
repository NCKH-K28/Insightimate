import serverConfig from '@/configs/server';
import { PrismaClient } from '@prisma/client';

const dbConfig = serverConfig.db;
const getGlobalPrisma = () => {
  const globalForPrisma = globalThis as unknown as any;
  const { prisma } = globalForPrisma;
  if (prisma) return prisma as typeof client;

  const client = new PrismaClient({ datasources: { db: { url: dbConfig.url } } });

  Object.assign(globalForPrisma, { prisma: client });
  return client;
};

export const prisma = getGlobalPrisma();
export const prismaClient = prisma;

// health check
const healthCheck = async () => await prisma.$queryRaw`SELECT 1`;
await healthCheck().catch((err) => {
  console.error('Prisma health check failed:', err);
  process.exit(1);
});
