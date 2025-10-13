import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });
export type TxPrisma = Parameters<PrismaClient['$transaction']>[0];
export type TransactionClient = PrismaClient | Prisma.TransactionClient;
export const executeTransaction = async <T>(
  client: TransactionClient,
  command: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: Parameters<PrismaClient['$transaction']>[1],
): Promise<T> => {
  if ('$transaction' in client) {
    return client.$transaction(command, options);
  }
  return command(client);
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
