import { HTTP as CerbosClient } from '@cerbos/http';
import serverConfig from '@/configs/server';
import get from 'lodash/get';
import set from 'lodash/set';

const cerbosConfig = serverConfig.cerbos;
// policy path: policies/cerbos

// == Cerbos Client
export const getCerbos = (): CerbosClient => {
  const key = '__cerbosv2__';
  const cerbos = get(globalThis, key) as CerbosClient | undefined;
  if (cerbos) return cerbos;
  const newCerbos = new CerbosClient(cerbosConfig.apiURL);
  set(globalThis, key, newCerbos);
  return newCerbos;
};

export const cerbosClient = getCerbos();

// ==== types

export type CheckResources = CerbosClient['checkResources'];
export type CheckResource = CerbosClient['checkResource'];
export type CheckResourceResult = Awaited<ReturnType<CheckResource>>;
export type CheckResourcesResult = Awaited<ReturnType<CheckResources>>;

export type CerbosPrincipal = Parameters<CheckResource>[0]['principal'];
export type CerbosResource = Parameters<CheckResource>[0]['resource'];
export type CerbosCheckResourcesRequest = Parameters<CheckResources>[0];
export type CerbosCheckResourcesResponse = Awaited<ReturnType<CheckResources>>;

// ==== Utils
export const mapCerbosActionsToBooleans = (actions: Record<string, string>) => {
  return Object.entries(actions).reduce(
    (acc, [action, effect]) => {
      return Object.assign(acc, { [action]: effect === 'EFFECT_ALLOW' });
    },
    {} as Record<string, boolean>,
  );
};

type Results = CheckResourcesResult['results'];
type Result = Results[number] & { _actions: Record<string, boolean> };
export const mapCerbosCheckResourcesResults = (results: Results): Record<string, Result> => {
  return results.reduce(
    (acc, r) => {
      const _actions = mapCerbosActionsToBooleans(r.actions);
      return Object.assign(acc, { [r.resource.id]: { ...r, _actions } });
    },
    {} as Record<string, Result>,
  );
};

export const checkResourcesMapped = async (
  req: CerbosCheckResourcesRequest,
  client: CerbosClient = getCerbos(),
): Promise<{
  results: Record<string, Result>;
  raw: CerbosCheckResourcesResponse;
}> => {
  const raw = await client.checkResources(req);
  return { results: mapCerbosCheckResourcesResults(raw.results), raw };
};

// // == Health Check
await cerbosClient.checkHealth().catch((err) => {
  console.error('Cerbos health check failed:', err);
  process.exit(1);
});
