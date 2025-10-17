import z from 'zod';
import { HTTP } from '@cerbos/http';

const ZCerbosConfig = z.object({ CERBOS_API_URL: z.url() });
const cerbosConfig = ZCerbosConfig.parse(process.env);

// == Cerbos Client
export const cerbosEdge = new HTTP(cerbosConfig.CERBOS_API_URL);

const healthCheck = async () => {
  try {
    const resp = await cerbosEdge.checkHealth();
    console.log('Cerbos Health Check:', resp);
  } catch (error) {
    const err = {
      error: 'Cerbos health check failed',
      details: error instanceof Error ? error.message : String(error),
      config: cerbosConfig,
    };
    console.error(err);
  }
};
await healthCheck();

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
