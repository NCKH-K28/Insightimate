import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
const getGlobalPrisma = () => {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
  const { prisma } = globalForPrisma;
  if (prisma) return prisma as typeof client;

  const client = new PrismaClient({ datasources: { db: { url: dbUrl } } });

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
