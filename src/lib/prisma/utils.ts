import { PrismaClient, Prisma } from '@prisma/client';

export type TxPrisma = Parameters<PrismaClient['$transaction']>[0];
export type TransactionClient = PrismaClient | Prisma.TransactionClient;
export const executeTransaction = async <T, C extends TransactionClient>(
  client: C,
  command: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: Parameters<PrismaClient['$transaction']>[1],
): Promise<T> => {
  if ('$transaction' in client) {
    return client.$transaction(command, options);
  }
  return command(client);
};
