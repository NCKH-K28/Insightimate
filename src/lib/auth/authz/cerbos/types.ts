import { HTTP } from '@cerbos/http';

type CerbosClient = HTTP;

export type CheckResources = CerbosClient['checkResources'];
export type CheckResource = CerbosClient['checkResource'];
export type CheckResourceResult = Awaited<ReturnType<CheckResource>>;
export type CheckResourcesResult = Awaited<ReturnType<CheckResources>>;

export type CerbosPrincipal = Parameters<CheckResource>[0]['principal'];
export type CerbosResource = Parameters<CheckResource>[0]['resource'];
export type CerbosCheckResourcesRequest = Parameters<CheckResources>[0];
export type CerbosCheckResourcesResponse = Awaited<ReturnType<CheckResources>>;
