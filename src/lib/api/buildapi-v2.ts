import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Except, Simplify, Promisable, RequireAtLeastOne } from 'type-fest';
import { z, ZodType } from 'zod';
import mergeWith from 'lodash/mergeWith';
import get from 'lodash/get';
import { compile } from 'path-to-regexp';
import qs from 'qs';

/* ---------- Types ---------- */
export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

type AxiosReadBase = Except<AxiosRequestConfig, 'params' | 'url' | 'method' | 'data'>;
type AxiosWriteBase = Except<AxiosRequestConfig, 'url' | 'method' | 'data'>;
type AxiosRequestConfigPartial = Partial<AxiosRequestConfig>;

export type ReadConfig<TParams> = Simplify<
  AxiosReadBase & {
    params?: TParams;
    validate?: boolean;
    onMeta?: (meta: unknown, resp: AxiosResponse) => void;
  }
>;

export type WriteConfig = Simplify<
  AxiosWriteBase & {
    validate?: boolean;
    onMeta?: (meta: unknown, resp: AxiosResponse) => void;
  }
>;

type InferOr<T, D> = T extends ZodType<any, any, any> ? z.infer<T> : D;

/* ---------- Path params inference (":id") ---------- */
type StripQuery<S extends string> = S extends `${infer P}?${string}` ? P : S;
type ExtractParamNames<S extends string> = S extends `${string}:${infer Tail}`
  ? Tail extends `${infer Name}/${infer Rest}`
    ? StripQuery<Name> | ExtractParamNames<`/${Rest}`>
    : StripQuery<Tail>
  : never;

export type PathParams<TPath extends string> = [ExtractParamNames<TPath>] extends [never]
  ? Record<string, never>
  : { [K in ExtractParamNames<TPath>]: string | number };

/* ---------- Schemas ---------- */
type BaseSchemas<TPath extends string> = {
  context?: ZodType<PathParams<TPath>>;
  response?: ZodType<any, any, any>;
  query?: ZodType<any, any, any>;
  body?: ZodType<any, any, any>;
  meta?: ZodType<any, any, any>;
};

/** Nếu đã khai báo schemas thì phải có ít nhất 1 key */
export type Schemas<TPath extends string, _M extends Method> = RequireAtLeastOne<
  BaseSchemas<TPath>
>;

/* ---------- Endpoint options ---------- */
export type UnwrapMode =
  | 'none'
  | 'data'
  | { path: string }
  | ((resp: AxiosResponse) => Promisable<{ payload: unknown; meta?: unknown }>);

export type BodyType = 'json' | 'formData' | 'urlencoded' | 'raw';

export type EndpointNode<TPath extends string = string, M extends Method = Method> = {
  method: M;
  path: TPath;
  schemas?: Schemas<TPath, M>;
  validate?: boolean; // default false
  unwrap?: UnwrapMode;
  responseType?: AxiosRequestConfig['responseType'];
  bodyType?: BodyType;
};

export type ConfigTree = { [key: string]: EndpointNode<any, any> | ConfigTree };

type FunctionFromEndpoint<N extends EndpointNode<any, any>> = N['method'] extends 'get' | 'delete'
  ? <
      TResult = InferOr<
        N['schemas'] extends { response: infer R extends ZodType<any, any, any> } ? R : undefined,
        unknown
      >,
      TQuery = InferOr<
        N['schemas'] extends { query: infer Q extends ZodType<any, any, any> } ? Q : undefined,
        unknown
      >,
    >(
      ctx: PathParams<N['path']>,
      params?: TQuery,
      config?: ReadConfig<TQuery>,
    ) => Promise<TResult>
  : <
      TResult = InferOr<
        N['schemas'] extends { response: infer R2 extends ZodType<any, any, any> } ? R2 : undefined,
        unknown
      >,
      TBody = InferOr<
        N['schemas'] extends { body: infer B extends ZodType<any, any, any> } ? B : undefined,
        unknown
      >,
    >(
      ctx: PathParams<N['path']>,
      body: TBody,
      config?: WriteConfig,
    ) => Promise<TResult>;

type ApiFromConfig<C> =
  C extends EndpointNode<any, any>
    ? FunctionFromEndpoint<C>
    : Simplify<{ [K in keyof C]: ApiFromConfig<C[K]> }>;

/* ---------- Helpers ---------- */
const parseIf = <T>(enabled: boolean, schema: ZodType<T> | undefined, data: unknown): T =>
  enabled && schema ? schema.parse(data) : (data as T);

const mergeAxiosConfig = (
  ...items: Array<AxiosRequestConfigPartial | undefined>
): AxiosRequestConfig =>
  mergeWith({}, ...items.filter(Boolean), (objValue: any, srcValue: any) => {
    if (Array.isArray(objValue)) return srcValue;
    return undefined;
  }) as AxiosRequestConfig;

const defaultSerializeParams = (params: any) =>
  qs.stringify(params, { arrayFormat: 'brackets', skipNulls: true, encodeValuesOnly: true });

const ensureParamsSerializer = (cfg: AxiosRequestConfig): AxiosRequestConfig =>
  cfg.paramsSerializer
    ? cfg
    : { ...cfg, paramsSerializer: { serialize: defaultSerializeParams } as any };

function toFormData(body: any): any {
  if (typeof FormData !== 'undefined') {
    const fd = new FormData();
    if (body && typeof body === 'object') {
      for (const [k, v] of Object.entries(body)) {
        if (Array.isArray(v)) v.forEach((item) => fd.append(k, item as any));
        else fd.append(k, v as any);
      }
    }
    return fd;
  }
  throw new Error(
    'FormData is not available. In Node, add a FormData polyfill (undici) or use raw body.',
  );
}

async function unwrapResponse(mode: UnwrapMode | undefined, resp: AxiosResponse) {
  if (!mode || mode === 'none') return { payload: resp.data, meta: undefined };
  if (mode === 'data') return { payload: resp.data?.data ?? resp.data, meta: resp.data?.meta };
  if (typeof mode === 'function') return await mode(resp);
  return { payload: get(resp.data, mode.path), meta: resp.data?.meta };
}

function isEndpoint(n: any): n is EndpointNode<string, Method> {
  return !!n && typeof n === 'object' && 'method' in n && 'path' in n;
}

/* ---------- Endpoint builder ---------- */
function createEndpoint<TPath extends string, M extends Method>(
  client: AxiosInstance,
  node: EndpointNode<TPath, M>,
) {
  const {
    method,
    path,
    schemas,
    validate: baseValidate = false,
    unwrap,
    responseType,
    bodyType,
  } = node;
  const toPath = compile(path, { encode: encodeURIComponent });

  const baseReqCfg: AxiosRequestConfig = ensureParamsSerializer(
    mergeAxiosConfig(responseType ? { responseType } : undefined),
  );

  const shouldZodParseResponse = (rt?: AxiosRequestConfig['responseType']) =>
    rt == null || rt === 'json' || rt === 'text';

  if (method === 'get' || method === 'delete') {
    return async <TResult = unknown, TQuery = unknown>(
      context: PathParams<TPath>,
      params?: TQuery,
      config?: ReadConfig<TQuery>,
    ): Promise<TResult> => {
      const validate = config?.validate ?? baseValidate;

      const validCtx = parseIf(validate, (schemas as any)?.context, context);
      const url = toPath(validCtx as any);

      const rawParams = (params ?? (config as any)?.params) as unknown;
      const parsedParams =
        rawParams !== undefined ? parseIf(validate, (schemas as any)?.query, rawParams) : undefined;

      const { validate: _v, params: _p, onMeta, ...restCfg } = config ?? {};
      const axiosCfg = mergeAxiosConfig(
        baseReqCfg,
        restCfg,
        parsedParams !== undefined ? { params: parsedParams } : undefined,
      );

      const resp = await client.request({ method, url, ...(axiosCfg as any) });

      if (resp.status === 204) return undefined as any;

      const { payload, meta } = await unwrapResponse(unwrap, resp);

      if (meta !== undefined) {
        const parsedMeta = parseIf(validate, (schemas as any)?.meta, meta);
        onMeta?.(parsedMeta, resp);
      }

      const canParse =
        validate && (schemas as any)?.response && shouldZodParseResponse(responseType);
      return canParse ? parseIf(true, (schemas as any)?.response, payload) : (payload as any);
    };
  }

  return async <TResult = unknown, TBody = unknown>(
    context: PathParams<TPath>,
    body: TBody,
    config?: WriteConfig,
  ): Promise<TResult> => {
    const validate = config?.validate ?? baseValidate;

    const validCtx = parseIf(validate, (schemas as any)?.context, context);
    const url = toPath(validCtx as any);

    const { validate: _v, onMeta, ...restCfg } = config ?? {};

    const parsedBody = (schemas as any)?.body
      ? parseIf(validate, (schemas as any)?.body, body)
      : body;

    let data: any = parsedBody;
    let extraHeaders: Record<string, string> | undefined;

    const bt: BodyType = bodyType ?? 'json';
    if (bt === 'formData') {
      data = parsedBody instanceof FormData ? parsedBody : toFormData(parsedBody);
    } else if (bt === 'urlencoded') {
      data = qs.stringify(parsedBody as any, { arrayFormat: 'brackets', encodeValuesOnly: true });
      extraHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };
    } else if (bt === 'raw') {
      data = parsedBody;
    }

    const axiosCfg = mergeAxiosConfig(
      baseReqCfg,
      restCfg,
      extraHeaders ? { headers: extraHeaders } : undefined,
    );

    const resp = await client.request({ method, url, data, ...(axiosCfg as any) });

    if (resp.status === 204) return undefined as any;

    const { payload, meta } = await unwrapResponse(unwrap, resp);

    if (meta !== undefined) {
      const parsedMeta = parseIf(validate, (schemas as any)?.meta, meta);
      onMeta?.(parsedMeta, resp);
    }

    const canParse = validate && (schemas as any)?.response && shouldZodParseResponse(responseType);
    return canParse ? parseIf(true, (schemas as any)?.response, payload) : (payload as any);
  };
}

/* ---------- Public builder ---------- */
type BuildApiOptions = {
  client?: AxiosInstance;
  baseURL?: string;
  axiosConfig?: Except<AxiosRequestConfig, 'baseURL'>;
};

export function buildApi<C extends ConfigTree>(
  config: C,
  opts?: BuildApiOptions,
): ApiFromConfig<C> {
  const base: AxiosRequestConfig = { baseURL: opts?.baseURL, ...(opts?.axiosConfig ?? {}) };
  const client = opts?.client ?? axios.create(ensureParamsSerializer(base));

  const walk = (node: any): any => {
    if (isEndpoint(node)) return createEndpoint<any, any>(client, node as any);
    if (node && typeof node === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(node)) out[k] = walk(node[k]);
      return out;
    }
    throw new Error('Invalid config node.');
  };

  return walk(config);
}

/* ---------- Convenient exports ---------- */
export type { ZodType as ZodAny };
export type { ReadConfig as RequestOptions };
