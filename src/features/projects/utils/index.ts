import { ProjectImport } from '@/contracts/projects';
import {
  genProjectId,
  genIssueStatusId,
  genIssuePriorityId,
  genIssueTypeId,
  genProjectRoleId,
} from '@/features/projects/configs/id-generators';

type IdMap = Record<string, string>;
const mapIdStrict = (m: IdMap, id?: string | null, label = 'id') => {
  if (!id) return id;
  const mapped = m[id];
  if (!mapped) throw new Error(`Missing ${label} mapping for: ${id}`);
  return mapped;
};

const buildIdMap = <T extends { id: string }>(rows: readonly T[], gen: () => string): IdMap => {
  const m: IdMap = {};
  for (const r of rows) m[r.id] = gen();
  return m;
};

const mapRequired = (m: IdMap, id: string, label = 'id'): string => {
  const mapped = m[id];
  if (!mapped) throw new Error(`Missing ${label} mapping for: ${id}`);
  return mapped;
};

const mapOptional = (m: IdMap, id?: string | null) => (id ? (m[id] ?? id) : id);

export const remapProjectImportIds = (
  data: ProjectImport,
): {
  remapped: ProjectImport;
  maps: { roleIdMap: IdMap; typeIdMap: IdMap; priorityIdMap: IdMap; statusIdMap: IdMap };
} => {
  const newProjectId = genProjectId();

  const roleIdMap = buildIdMap(data.roles, genProjectRoleId);
  const typeIdMap = buildIdMap(data.types, genIssueTypeId);
  const priorityIdMap = buildIdMap(data.priorities, genIssuePriorityId);
  const statusIdMap = buildIdMap(data.statuses, genIssueStatusId);

  const remapped: ProjectImport = {
    ...data,
    id: newProjectId,

    roles: data.roles.map((r) => ({ ...r, id: roleIdMap[r.id] })),
    types: data.types.map((t) => ({ ...t, id: typeIdMap[t.id] })),
    priorities: data.priorities.map((p) => ({ ...p, id: priorityIdMap[p.id] })),
    statuses: data.statuses.map((s) => ({ ...s, id: statusIdMap[s.id] })),

    actors: data.actors.map((a) => ({ ...a, roleId: mapRequired(roleIdMap, a.roleId, 'roleId') })),

    issues: data.issues.map((i: any) => ({
      ...i,
      typeId: mapRequired(typeIdMap, i.typeId, 'typeId'),
      priorityId: mapRequired(priorityIdMap, i.priorityId, 'priorityId'),
      statusId: mapRequired(statusIdMap, i.statusId, 'statusId'),
    })),
  };

  return { remapped, maps: { roleIdMap, typeIdMap, priorityIdMap, statusIdMap } };
};
