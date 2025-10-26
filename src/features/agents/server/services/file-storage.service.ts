import { Prisma } from '@prisma/client';

export const deleteFileReference = async (
  id: string,
  context: any,
  deps: { prisma: Prisma.TransactionClient },
) => {};
