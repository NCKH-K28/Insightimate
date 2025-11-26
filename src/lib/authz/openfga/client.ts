import * as path from 'path';
import * as fs from 'fs/promises';
import { OpenFgaClient } from '@openfga/sdk';
import serverConfig from '@/configs/server';
import get from 'lodash/get';
import set from 'lodash/set';

const fgaConfig = serverConfig.openFGA;

const getOpenFGA = (): OpenFgaClient => {
  const key = '__openfga__';
  const openfga = get(globalThis, key) as OpenFgaClient | undefined;
  if (openfga) return openfga;
  const newOpenFGA = new OpenFgaClient({ apiUrl: fgaConfig.apiURL, storeId: fgaConfig.storeID });
  set(globalThis, key, newOpenFGA);
  return newOpenFGA;
};

export const openfgaClient = getOpenFGA();

// == Load Authorization Model File
const authorizationModelPath = 'scripts/openfga/rbac-authorization-model.json';
export const loadAuthorizationModelFile = async () => {
  const filePath = path.join(process.cwd(), authorizationModelPath);
  const fileExists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  if (!fileExists) throw new Error(`Authorization model file not found at path: ${filePath}`);

  const fileContents = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContents);
};

const healthCheck = async () => {
  const { authorization_models: authzModels } = await openfgaClient.readAuthorizationModels();
  if (authzModels.length > 0) return;
  const model = await loadAuthorizationModelFile();
  await openfgaClient.writeAuthorizationModel(model);

  console.log('OpenFGA authorization model initialized');
};

await healthCheck().catch((err) => {
  console.error('OpenFGA health check failed:', err);
  process.exit(1);
});
