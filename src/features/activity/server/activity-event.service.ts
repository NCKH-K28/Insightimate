import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActivityAction, ActivityEntity, ActivityFeedQuery } from '@/contracts/activity';

// ==================== Types ====================

type ActivityEventWithActor = Prisma.ActivityEventGetPayload<{
  include: { actor: { select: { id: true; name: true; email: true; avatar: true } } };
}>;

type ListResult = {
  items: ActivityEventWithActor[];
  nextCursor: string | null;
};

// ==================== Helpers ====================

const ACTOR_SELECT = { id: true, name: true, email: true, avatar: true } as const;

function buildWhere(
  query: Pick<ActivityFeedQuery, 'orgId' | 'projectId' | 'entityId' | 'entity' | 'action' | 'actorId'>,
  allowedProjectIds?: string[],
): Prisma.ActivityEventWhereInput {
  const where: Prisma.ActivityEventWhereInput = {
    orgId: query.orgId,
  };

  if (query.projectId) {
    where.projectId = query.projectId;
  } else if (allowedProjectIds) {
    // Filter to only projects the user has access to, plus org-level events (projectId = null)
    where.OR = [{ projectId: { in: allowedProjectIds } }, { projectId: null }];
  }

  if (query.entity) where.entity = query.entity;
  if (query.entityId) where.entityId = query.entityId;
  if (query.action) where.action = query.action;
  if (query.actorId) where.actorId = query.actorId;

  return where;
}

// ==================== Service Functions ====================

/**
 * List activity events for an organization with cursor-based pagination.
 * Events are ordered by `createdAt DESC` (newest first).
 *
 * @param query - Filter/pagination parameters
 * @param allowedProjectIds - Optional list of project IDs the user can view (from OpenFGA).
 *   If provided, only events for those projects (+ org-level events) are returned.
 *   If omitted, all events in the org are returned (caller must ensure authorization).
 */
async function listActivityEvents(
  query: ActivityFeedQuery,
  allowedProjectIds?: string[],
): Promise<ListResult> {
  const { cursor, limit } = query;
  const take = limit + 1; // fetch one extra to determine if there's a next page

  const where = buildWhere(query, allowedProjectIds);

  const events = await prisma.activityEvent.findMany({
    where,
    include: {
      actor: { select: ACTOR_SELECT },
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}

/**
 * List activity events scoped to a single project.
 */
async function listProjectActivityEvents(
  projectId: string,
  query: Omit<ActivityFeedQuery, 'orgId' | 'projectId'> & { orgId: string },
): Promise<ListResult> {
  return listActivityEvents({ ...query, projectId });
}

/**
 * Count activity events (useful for badges/indicators).
 */
async function countActivityEvents(
  query: Pick<ActivityFeedQuery, 'orgId' | 'projectId' | 'entity' | 'action'>,
  allowedProjectIds?: string[],
): Promise<number> {
  const where = buildWhere(query, allowedProjectIds);
  return prisma.activityEvent.count({ where });
}

// ==================== Export ====================

export const activityEventService = {
  list: listActivityEvents,
  listForProject: listProjectActivityEvents,
  count: countActivityEvents,
};
