import { HTTP } from '@cerbos/http';
import {
  CerbosCheckResourcesRequest,
  CerbosCheckResourcesResponse,
  CheckResourcesResult,
} from './types';

export const getCerbosGlobal = () => {
  const { cerbos } = globalThis as unknown as { cerbos: HTTP | undefined };
  if (!cerbos) throw new Error('Cerbos client not initialized in globalThis');
  return cerbos;
};

// == Helpers
export const mapCerbosActionsToBooleans = (actions: Record<string, string>) => {
  return Object.entries(actions).reduce((acc, [action, effect]) => {
    return Object.assign(acc, { [action]: effect === 'EFFECT_ALLOW' });
  }, {} as Record<string, boolean>);
};

type Results = CheckResourcesResult['results'];
type Result = Results[number] & { _actions: Record<string, boolean> };
export const mapCerbosCheckResourcesResults = (results: Results) => {
  return results.reduce((acc, r) => {
    const _actions = mapCerbosActionsToBooleans(r.actions);
    return Object.assign(acc, { [r.resource.id]: { ...r, _actions } });
  }, {} as Record<string, Result>);
};

export const checkResourcesMapped = async (
  req: CerbosCheckResourcesRequest,
  client: HTTP = getCerbosGlobal(),
): Promise<{
  results: ReturnType<typeof mapCerbosCheckResourcesResults>;
  raw: CerbosCheckResourcesResponse;
}> => {
  const raw = await client.checkResources(req);
  return { results: mapCerbosCheckResourcesResults(raw.results), raw };
};
