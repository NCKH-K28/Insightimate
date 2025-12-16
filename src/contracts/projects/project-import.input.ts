import { z } from 'zod';
import { ZProjectRole } from './project';
import { ZIssue, ZIssuePriority, ZIssueStatus, ZIssueType } from '../issues/issue';
import countBy from 'lodash/countBy';
import { ZProjectCreateInput } from './projects.input';

export const ZProjectImport = z.object({
  id: z.string(),
  key: ZProjectCreateInput.shape.key,
  name: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  leadId: z.string(),

  // === Related Data ===
  actors: z
    .object({ actorId: z.string(), actorType: z.enum(['USER']), roleId: z.string() })
    .array(),
  roles: ZProjectRole.omit({ projectId: true })
    .extend({ createdAt: z.string().optional(), updatedAt: z.string().optional() })
    .array(),
  types: ZIssueType.omit({ projectId: true }).array(),
  priorities: ZIssuePriority.omit({ projectId: true }).array(),
  statuses: ZIssueStatus.omit({ projectId: true }).array(),
  issues: ZIssue.omit({ projectId: true }).array(),
});
export type ProjectImport = z.infer<typeof ZProjectImport>;

const addDuplicateIdIssues = (
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
  items: { id: string }[],
  label: string,
) => {
  const counts = countBy(items, 'id');
  items.forEach((it, i) => {
    if (counts[it.id] > 1) {
      const message = `Duplicate ${label} id ${it.id} at index ${i}`;
      ctx.addIssue({ code: 'custom', message, path: [...pathPrefix, i, 'id'] });
    }
  });
};

export const ZProjectImportWithLogic = ZProjectImport.superRefine((data, ctx) => {
  const { actors, roles, types, priorities, statuses, issues } = data;

  addDuplicateIdIssues(ctx, ['project', 'roles'], roles, 'role');
  addDuplicateIdIssues(ctx, ['project', 'types'], types, 'type');
  addDuplicateIdIssues(ctx, ['project', 'priorities'], priorities, 'priority');
  addDuplicateIdIssues(ctx, ['project', 'statuses'], statuses, 'status');

  const roleIds = new Set(roles.map((r) => r.id));
  const typeIds = new Set(types.map((t) => t.id));
  const priorityIds = new Set(priorities.map((p) => p.id));
  const statusIds = new Set(statuses.map((s) => s.id));

  for (let i = 0; i < actors.length; i++) {
    if (!roleIds.has(actors[i].roleId)) {
      const message = `Actor at index ${i} has invalid roleId ${actors[i].roleId}`;
      ctx.addIssue({ code: 'custom', message, path: ['project', 'actors', i, 'roleId'] });
    }
  }

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    if (!typeIds.has(issue.typeId)) {
      const message = `Issue at index ${i} has invalid typeId ${issue.typeId}`;
      ctx.addIssue({ code: 'custom', message, path: ['project', 'issues', i, 'typeId'] });
    }
    if (!priorityIds.has(issue.priorityId)) {
      const message = `Issue at index ${i} has invalid priorityId ${issue.priorityId}`;
      ctx.addIssue({ code: 'custom', message, path: ['project', 'issues', i, 'priorityId'] });
    }
    if (!statusIds.has(issue.statusId)) {
      const message = `Issue at index ${i} has invalid statusId ${issue.statusId}`;
      ctx.addIssue({ code: 'custom', message, path: ['project', 'issues', i, 'statusId'] });
    }
  }
});
