import { HTTP } from '@cerbos/http';
import serverConfig from '@/configs/server';
import get from 'lodash/get';
import set from 'lodash/set';

const cerbosConfig = serverConfig.cerbos;

// == Cerbos Client
export const getCerbos = (): HTTP => {
  const key = '__cerbos__';
  const cerbos = get(globalThis, key) as HTTP | undefined;
  if (cerbos) return cerbos;
  const newCerbos = new HTTP(cerbosConfig.apiURL);
  set(globalThis, key, newCerbos);
  return newCerbos;
};

export const cerbosEdge = getCerbos();
export const cerbosClient = cerbosEdge;

// // == Health Check
await cerbosEdge.checkHealth().catch((err) => {
  console.error('Cerbos health check failed:', err);
  process.exit(1);
});
