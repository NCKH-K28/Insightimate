import * as path from 'path';
import * as fs from 'fs/promises';
import { OpenFgaClient } from '@openfga/sdk';
import serverConfig from '@/configs/server';
import get from 'lodash/get';
import set from 'lodash/set';

const fgaConfig = serverConfig.openFGA;

const getOpenFGA = (): OpenFgaClient => {
  const key = '__openfgav2__';
  const openfga = get(globalThis, key) as OpenFgaClient | undefined;
  if (openfga) return openfga;
  const newOpenFGA = new OpenFgaClient({ apiUrl: fgaConfig.apiURL, storeId: fgaConfig.storeID });
  set(globalThis, key, newOpenFGA);
  return newOpenFGA;
};

export const openfgaClient = getOpenFGA();
import { transformer } from '@openfga/syntax-transformer';
// == Load Authorization Model File
const modelPath = path.join(process.cwd(), 'policies/openfga/schema-v1.fga');
export const loadAuthorizationModel = async () => {
  const fileContents = await fs.readFile(modelPath, 'utf-8');
  const model = transformer.transformDSLToJSONObject(fileContents);
  return model;
};

// const authorizationModelPath = 'scripts/docker/base/openfga/rbac-authorization-model.json';
// export const loadAuthorizationModelFile = async () => {
//   const filePath = path.join(process.cwd(), authorizationModelPath);
//   const fileExists = await fs
//     .access(filePath)
//     .then(() => true)
//     .catch(() => false);
//   if (!fileExists) throw new Error(`Authorization model file not found at path: ${filePath}`);

//   const fileContents = await fs.readFile(filePath, 'utf-8');
//   return JSON.parse(fileContents);
// };

type TupleKey = { user: string; relation: string; object: string };

export async function clearAllTuples(fga: OpenFgaClient) {
  let continuationToken: string | undefined;

  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await fga.read(
      {}, // read all tuples
      { pageSize: 100, continuationToken },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuples = (res.tuples ?? []) as Array<{ key: any }>;
    const nextToken = res.continuation_token as string | undefined;

    if (!tuples.length) break;

    const deletes: TupleKey[] = tuples.map((t) => ({
      user: t.key.user,
      relation: t.key.relation,
      object: t.key.object,
    }));

    await fga.deleteTuples(deletes, {
      transaction: { disable: true, maxPerChunk: 50, maxParallelRequests: 10 },
    });

    continuationToken = nextToken;
  } while (continuationToken);
}

const _clearStores = async () => {
  const { stores } = await openfgaClient.listStores();
  // delete all stores
  for (const store of stores) {
    console.log(`Deleting OpenFGA store: ${store.id} - ${store.name}`);
    await openfgaClient.deleteStore({ storeId: store.id });
  }
};

const base = new OpenFgaClient({ apiUrl: fgaConfig.apiURL });
const _createStore = async () => {
  const store = await base.createStore({ name: `dev-store-v1` });
  console.log(`Created OpenFGA store: ${store.id} - ${store.name}`);
  const model = await loadAuthorizationModel();
  await base.writeAuthorizationModel(model, { storeId: store.id });
  console.log('Wrote authorization model to store');
  return store;
};

const _healthCheck = async () => {
  // await clearStores();
  // const store = await createStore();
  // console.log(`Using OpenFGA store ID: ${store.id}`);
  // // ========
  // // ========
  // //
  // const { authorization_models: authzModels } = await openfgaClient.readAuthorizationModels();
  // if (authzModels.length > 0) return;
  // const model = await loadAuthorizationModel();
  // await openfgaClient.writeAuthorizationModel(model);
  // console.log('OpenFGA authorization model initialized');
};

// await healthCheck().catch((err) => {
//   console.error('OpenFGA health check failed:', err);
//   process.exit(1);
// });
