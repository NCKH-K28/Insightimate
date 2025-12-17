import {
  ProjectRole,
  ProjectRoleUpdateInput,
  ProjectRoleWriteInput,
  ZProjectRole,
  ZProjectRoleUpdateInput,
} from '@/contracts/projects';
import {
  buildProjectRoleTuples,
  buildProjectActorTuples,
} from '@/features/authz/api/tuple-factory';
import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { TupleKey } from '@openfga/sdk';
import { genProjectRoleId } from '../../configs/id-generators';

export const writeProjectRoles = async (
  input: ProjectRoleWriteInput & { projectId: string },
  _ctx: { actorId: string },
) => {
  // build trươc khi tạo transaction, đảm bao unique
  const createInputs = structuredClone(input.create || []);
  const updateInputs = structuredClone(input.update || []);
  const deleteInputs = structuredClone(input.delete || []);

  const createIds = new Set<string>(createInputs.map((c) => c.id));
  const deleteIds = new Set<string>(deleteInputs.map((d) => d.id));
  const deleteActionMap = new Map<string, string>(deleteInputs.map((d) => [d.action, d.id]));

  // [mutate input] id của create là role_temp_xxx, cần đổi thành role_xxx (đồng bộ với id trong delete transient nếu có)
  createInputs.forEach((c) => {
    const oldId = c.id;
    const newId = genProjectRoleId();

    c.id = newId;
    const oldAction = `delete:${oldId}#transient`;
    const newAction = `delete:${newId}#transient`;
    if (deleteActionMap.has(oldAction)) {
      const delId = deleteActionMap.get(oldAction);
      if (!delId) return;

      // Mutate in deleteActionMap
      deleteActionMap.delete(oldAction);
      deleteActionMap.set(newAction, delId);

      // Mutate in deleteInputs
      const delInput = deleteInputs.find((d) => d.id === delId);
      if (delInput) delInput.action = newAction;

      // Mutate in deleteIds
      deleteIds.delete(delId);
      deleteIds.add(delId);
    }
  });

  // ==
  const willCreates: ProjectRole[] = [];
  let willTransitions: Map<string, string[]> = new Map(); // targetId -> [sourceIds]
  const willDeletes: Set<string> = new Set(
    deleteInputs.filter((d) => d.action === 'delete').map((d) => d.id),
  );
  const willUpdates: ProjectRoleUpdateInput[] = [];

  // ==
  createInputs
    .map((c) =>
      ZProjectRole.parse({
        ...c,
        projectId: input.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
    .forEach((c) => willCreates.push(c));

  const delWithTransient = deleteInputs
    .map((d) => {
      const match = d.action.match(/^delete:(.+)#transient$/);
      if (!match) return null;
      return { source: d.id, target: match[1] };
    })
    .filter((t) => t !== null);

  delWithTransient.forEach((t) => willDeletes.add(t.source));
  willTransitions = flattenTransientSimple(delWithTransient);

  updateInputs
    .filter((u) => !deleteIds.has(u.id))
    .map((u) => ZProjectRoleUpdateInput.parse({ ...u, updatedAt: new Date() }))
    .forEach((u) => willUpdates.push(u));

  const existingRoleIds = new Set<string>([
    ...willUpdates.map((u) => u.id),
    ...willDeletes,
    ...Array.from(willTransitions.values())
      .flat()
      .filter((id) => !createIds.has(id)),
  ]);

  if (existingRoleIds.size == 0 && willCreates.length === 0) {
    throw new Error('No operations to perform.');
  }

  return prisma.$transaction(
    async (tx) => {
      // 1. Validate existence of all involved role IDs
      const count = await tx.projectRole.count({
        where: { id: { in: Array.from(existingRoleIds) }, projectId: input.projectId },
      });
      if (count !== existingRoleIds.size)
        throw new Error('Some roles do not exist in the project.');

      const deleteTuples: TupleKey[] = [];
      const writeTuples: TupleKey[] = [];

      // 2. CREATE
      if (willCreates.length > 0) {
        await tx.projectRole.createMany({ data: willCreates }).then(({ count }) => {
          if (count !== willCreates.length) throw new Error('Failed to create all project roles.');
        });

        const tuples = willCreates
          .map((r) => ({ ...r, actors: [] }))
          .flatMap(buildProjectRoleTuples);

        writeTuples.push(...tuples);
      }

      // 3. UPDATE
      await Promise.all(
        willUpdates.map((role) =>
          tx.projectRole.update({
            where: { id: role.id, projectId: input.projectId },
            data: { ...role },
          }),
        ),
      );

      // 4. TRANSITION
      await Promise.all(
        Array.from(willTransitions.entries()).map(async ([targetId, sourceIds]) => {
          const sourceActors = await tx.projectActor.findMany({
            where: { roleId: { in: sourceIds }, projectId: input.projectId },
          });
          if (sourceActors.length === 0) return;
          // (4.1) DELETE tuples cũ (actor ↦ sourceRole) TRƯỚC KHI update
          const tuplesToDelete = sourceActors.flatMap(
            (actor) => buildProjectActorTuples(actor), // actor.roleId hiện là sourceRole
          );
          deleteTuples.push(...tuplesToDelete);

          // (4.2) Chuyển roleId ở DB
          await tx.projectActor.updateMany({
            where: { roleId: { in: sourceIds }, projectId: input.projectId },
            data: { roleId: targetId },
          });

          // (4.3) WRITE tuples mới (actor ↦ targetRole) SAU KHI update
          const tuplesToWrite = sourceActors.flatMap((actor) =>
            buildProjectActorTuples({ ...actor, roleId: targetId }),
          );
          writeTuples.push(...tuplesToWrite);
        }),
      );
      if (willDeletes.size > 0) {
        const ids = Array.from(willDeletes);

        // Lấy dữ liệu TRƯỚC KHI xóa để build delete-tuples chính xác
        const rolesToDelete = await tx.projectRole.findMany({
          where: { id: { in: ids }, projectId: input.projectId },
          include: { actors: true },
        });

        // (5.1) DELETE tuples của ROLE (permission, membership template, v.v.)
        deleteTuples.push(...rolesToDelete.flatMap((role) => buildProjectRoleTuples(role)));

        // (5.2) Xóa DB
        await tx.projectRole.deleteMany({ where: { id: { in: ids }, projectId: input.projectId } });
      }

      const dels = uniq(deleteTuples);
      const writes = uniq(writeTuples);
      if (dels.length || writes.length) await openfgaClient.write({ deletes: dels, writes });

      return {
        created: willCreates.length,
        updated: willUpdates.length,
        deleted: willDeletes.size,
        transitioned: Array.from(willTransitions.values()).flat().length,
      };
    },
    { timeout: 30000 },
  );
};

function flattenTransientSimple(
  transientTo: { source: string; target: string }[],
): Map<string, string[]> {
  // 1. Tạo lookup map: source -> target
  const lookup = new Map<string, string>();
  transientTo.forEach(({ source, target }) => lookup.set(source, target));

  // 2. Hàm tìm root cuối cùng
  function findRoot(node: string, visited = new Set<string>()): string {
    // Detect circular reference
    if (visited.has(node)) {
      throw new Error(
        `Circular reference detected: ${Array.from(visited).join(' -> ')} -> ${node}`,
      );
    }

    const target = lookup.get(node);
    if (!target) return node; // Đây là root

    visited.add(node);
    return findRoot(target, visited);
  }

  const result = new Map<string, string[]>();
  lookup.forEach((_, source) => {
    const root = findRoot(source);
    if (!result.has(root)) result.set(root, []);
    result.get(root)!.push(source);
  });

  return result;
}

// Loại bỏ các TupleKey trùng lặp
const uniq = (keys: TupleKey[]) => {
  const seen = new Set<string>();
  return keys.filter((k) => {
    const sig = JSON.stringify(k);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
};
