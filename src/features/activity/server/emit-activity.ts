import 'server-only';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { ActivityAction, ActivityEntity } from '@/contracts/activity';

// ==================== Types ====================

export type EmitActivityInput = {
  orgId: string;
  projectId?: string | null;
  actorId: string;
  actorName?: string;
  actorType?: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  entityKey?: string;
  entityTitle?: string;
  changes?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  groupKey?: string;
};

// ==================== Emit (Fire-and-Forget) ====================

/**
 * Emit an activity event. This is a fire-and-forget operation that
 * inserts into the `activity_events` table without blocking the caller.
 *
 * Usage:
 *   emitActivity({ orgId, actorId, action: 'CREATED', entity: 'PROJECT', entityId: proj.id });
 */
export function emitActivity(input: EmitActivityInput): void {
  prisma.activityEvent
    .create({
      data: {
        orgId: input.orgId,
        projectId: input.projectId ?? null,
        actorId: input.actorId,
        actorName: input.actorName,
        actorType: input.actorType ?? 'USER',
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        entityKey: input.entityKey,
        entityTitle: input.entityTitle,
        changes: input.changes as any,
        metadata: input.metadata as any,
        groupKey: input.groupKey,
      },
    })
    .catch((err) => {
      logger.error({ err, input }, 'Failed to emit activity event');
    });
}

/**
 * Emit an activity event within an existing Prisma transaction.
 * Unlike `emitActivity`, this DOES participate in the transaction.
 */
export async function emitActivityTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: EmitActivityInput,
): Promise<void> {
  await tx.activityEvent.create({
    data: {
      orgId: input.orgId,
      projectId: input.projectId ?? null,
      actorId: input.actorId,
      actorName: input.actorName,
      actorType: input.actorType ?? 'USER',
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      entityKey: input.entityKey,
      entityTitle: input.entityTitle,
      changes: input.changes as any,
      metadata: input.metadata as any,
      groupKey: input.groupKey,
    },
  });
}
