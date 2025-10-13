// lib/cerbos
// import cerboes http
import { HTTP } from '@cerbos/http';

const cerbosUrl = process.env.CERBOS_URL || 'http://localhost:3592';
export const cerbosEdge = new HTTP(cerbosUrl);

export type CerbosPrincipal = Parameters<typeof cerbosEdge.checkResource>[0]['principal'];
export type CerbosResource = Parameters<typeof cerbosEdge.checkResource>[0]['resource'];
export type CerbosCheckResourcesRequest = Parameters<typeof cerbosEdge.checkResources>[0];
export type CerbosCheckResourcesResponse = Awaited<ReturnType<typeof cerbosEdge.checkResources>>;

// == Helpers
export const mapCerbosActionsToBooleans = (actions: Record<string, string>) => {
  return Object.entries(actions).reduce((acc, [action, effect]) => {
    return Object.assign(acc, { [action]: effect === 'EFFECT_ALLOW' });
  }, {} as Record<string, boolean>);
};

type Results = CerbosCheckResourcesResponse['results'];
type Result = Results[number] & { _actions: Record<string, boolean> };
export const mapCerbosCheckResourcesResults = (results: Results) => {
  return results.reduce((acc, r) => {
    const _actions = mapCerbosActionsToBooleans(r.actions);
    return Object.assign(acc, { [r.resource.id]: { ...r, _actions } });
  }, {} as Record<string, Result>);
};

export const checkResourcesMapped = async (
  req: CerbosCheckResourcesRequest,
): Promise<{
  results: ReturnType<typeof mapCerbosCheckResourcesResults>;
  raw: CerbosCheckResourcesResponse;
}> => {
  const raw = await cerbosEdge.checkResources(req);
  return { results: mapCerbosCheckResourcesResults(raw.results), raw };
};
