import * as path from 'path';
import * as fs from 'fs/promises';
import { OpenFgaClient } from '@openfga/sdk';
import z from 'zod';

const ZFgaConfig = z.object({
  OPENFGA_API_URL: z.url(),
  OPENFGA_STORE_ID: z.string().min(1),
});

const fgaConfig = ZFgaConfig.parse(process.env);

export const openfgaClient = new OpenFgaClient({
  apiUrl: fgaConfig.OPENFGA_API_URL,
  storeId: fgaConfig.OPENFGA_STORE_ID,
});

export const loadAuthorizationModelFile = async () => {
  const filePath = path.join(process.cwd(), 'scripts', 'openfga', 'rbac-authorization-model.json');
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

await healthCheck();
