import { ProjectConflictError } from '@/lib/http/errors';
import type { TxClient } from './types';
import { prisma } from '@/lib/prisma';

export const assertProjectKeyAvailable = async (
  unique: { workspaceId: string; key: string },
  tx: TxClient = prisma,
): Promise<void> => {
  const exists = await tx.project.findUnique({ where: { workspaceId_key: unique } });
  if (exists) throw new ProjectConflictError(unique.key);
};
