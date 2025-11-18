import { TupleKey } from '@openfga/sdk';
import { openfgaClient } from '@/lib/authz/openfga';
import { prisma } from '@/lib/prisma';
import { set } from 'lodash';
import * as path from 'path';
import * as fs from 'fs/promises';
import { buildWorkspaceTuples, buildTeamTuples, buildProjectTuples } from '../api/tuple-factory';

const loadAuthorizationModelFile = async () => {
  const filePath = path.join(process.cwd(), 'scripts', 'openfga', 'rbac-authorization-model.json');
  const fileContents = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContents);
};

const rebuildWorkspaces = async (options?: { storeId?: string; authorizationModelId?: string }) => {
  const workspaces = await prisma.workspace.findMany({ include: { members: true } });

  const tuples: TupleKey[] = workspaces.flatMap(buildWorkspaceTuples);

  if (tuples.length > 0) await openfgaClient.writeTuples(tuples, options);
  return { writes: tuples.length };
};

const rebuildTeams = async (options?: { storeId?: string; authorizationModelId?: string }) => {
  const teams = await prisma.team.findMany({ include: { members: true } });

  const tuples: TupleKey[] = teams.flatMap(buildTeamTuples);

  if (tuples.length > 0) await openfgaClient.writeTuples(tuples, options);
  return { writes: tuples.length };
};

const rebuildProjects = async (options?: { storeId?: string; authorizationModelId?: string }) => {
  const projects = await prisma.project.findMany({
    include: { roles: { include: { actors: true } } },
  });

  // const first = projects[0];
  // const t = first
  //   ? buildProjectTuples({
  //       ...first,
  //       permissions: [],
  //       roles: first.roles.map((role) => ({
  //         ...role,
  //         permissions: JSON.parse(JSON.stringify(role.permissions || ({} as any[]))),
  //       })),
  //     })
  //   : [];

  const tuples: TupleKey[] = projects.flatMap((project) =>
    buildProjectTuples({
      ...project,
      permissions: [],
      roles: project.roles.map((role) => ({
        ...role,
        permissions: JSON.parse(JSON.stringify(role.permissions || ({} as any[]))),
      })),
    }),
  );

  if (tuples.length > 0) await openfgaClient.writeTuples(tuples, options);
  return { writes: tuples.length };
};

const clearAuthorizationModel = async (options?: {
  storeId?: string;
  authorizationModelId?: string;
}) => {
  const allTuples = await openfgaClient.read({}, options);
  const deletes = allTuples.tuples.map(({ key }) => key);
  if (deletes.length > 0) await openfgaClient.deleteTuples(deletes, options);
};

export const rebuildAuthzData = async () => {
  const result: Record<string, any> = {};

  // const currentStoreId = openfgaClient.storeId;
  // const newStore = await openfgaClient.createStore({ name: `rebuild-${Date.now()}` });
  const newStore = { id: undefined };
  const model = await loadAuthorizationModelFile();
  const { authorization_model_id } = await openfgaClient.writeAuthorizationModel(model, {
    storeId: newStore.id,
  });
  const authorizationModelId = authorization_model_id;

  await clearAuthorizationModel({ storeId: newStore.id, authorizationModelId });

  await rebuildWorkspaces({ storeId: newStore.id, authorizationModelId })
    .then((writes) => set(result, 'workspaces', writes))
    .catch((err) => set(result, 'workspaces', err.message));

  await rebuildTeams({ storeId: newStore.id, authorizationModelId })
    .then((writes) => set(result, 'teams', writes))
    .catch((err) => set(result, 'teams', err.message));

  await rebuildProjects({ storeId: newStore.id, authorizationModelId })
    .then((writes) => set(result, 'projects', writes))
    .catch((err) => set(result, 'projects', err.message));
  return result;
};
