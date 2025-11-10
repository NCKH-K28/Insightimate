import { PrismaClient } from '@prisma/client';

// import { z } from 'zod';
// const ZPrismaConfig = z.object({ DATABASE_URL: z.string().min(1) });
// const prismaConfig = ZPrismaConfig.parse(process.env);

const getGlobalPrisma = () => {
  const globalForPrisma = globalThis as unknown as any;
  const { prisma } = globalForPrisma;
  if (prisma) return prisma as typeof client;

  const client = new PrismaClient({});

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
