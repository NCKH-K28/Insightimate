import type { AxiosRequestConfig } from 'axios';
import { z, ZodType } from 'zod';
import { baseApi, PathParams } from './_client';
import merge from 'lodash/merge';

/* ---------- Methods & helpers ---------- */
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
type ReadConfig<TParams> = Omit<AxiosRequestConfig, 'params'> & {
  params?: TParams;
  validate?: boolean;
};
type WriteConfig = AxiosRequestConfig & { validate?: boolean };
type InferOr<T, D> = T extends ZodType ? z.infer<T> : D;

const parseIf = <T>(enabled: boolean, schema: ZodType<T> | undefined, data: unknown): T =>
  enabled && schema ? schema.parse(data) : (data as T);

/* ---------- Schemas ---------- */
type BaseSchemas<TPath extends string> = {
  context?: ZodType<PathParams<TPath>>;
  response?: ZodType;
};
type QuerySchemas<TPath extends string> = BaseSchemas<TPath> & { query?: ZodType };
type BodySchemas<TPath extends string> = BaseSchemas<TPath> & { body?: ZodType };

type Schemas<TPath extends string, M extends Method> = M extends 'get' | 'delete'
  ? QuerySchemas<TPath>
  : BodySchemas<TPath>;

/* ---------- Config shape ---------- */
type EndpointNode<TPath extends string = string, M extends Method = Method> = {
  method: M;
  path: TPath;
  schemas?: Schemas<TPath, M>;
  validate?: boolean; // default false
};
type ConfigTree = { [key: string]: EndpointNode<any, any> | ConfigTree };

/* ---------- Endpoint builder (1 endpoint) ---------- */
function createEndpoint<
  TPath extends string,
  M extends Method,
  S extends Schemas<TPath, M> | undefined = undefined,
>(method: M, path: TPath, schemas?: S, opts?: { validate?: boolean }) {
  const raw = baseApi.buildMethod(path, method);

  const baseValidate = opts?.validate ?? false;

  if (method === 'get' || method === 'delete') {
    return <
      TResult = InferOr<S extends { response: infer R extends ZodType } ? R : undefined, unknown>,
      TQuery = InferOr<S extends { query: infer Q extends ZodType } ? Q : undefined, unknown>,
    >(
      context: PathParams<TPath>,
      params?: TQuery,
      config?: ReadConfig<TQuery>,
    ): Promise<TResult> => {
      // log config
      const validate = config?.validate ?? baseValidate;

      const validContext =
        schemas && 'context' in (schemas as object)
          ? parseIf(validate, (schemas as any).context, context)
          : context;

      const validParams =
        params && schemas && 'query' in (schemas as object)
          ? parseIf(validate, (schemas as any).query, params)
          : params;

      const axiosCfg: AxiosRequestConfig = merge(
        {},
        config ?? {},
        validParams ? { params: validParams } : {},
      );
      // log config
      console.log('Request Config ++:', { context, config });

      return raw<TResult>(validContext as any, axiosCfg).then((data: unknown) =>
        parseIf(validate, (schemas as any)?.response, data),
      );
    };
  }

  // POST / PUT / PATCH
  return async <
    TResult = InferOr<S extends { response: infer R2 extends ZodType } ? R2 : undefined, unknown>,
    TBody = InferOr<S extends { body: infer B extends ZodType } ? B : undefined, unknown>,
  >(
    context: PathParams<TPath>,
    body: TBody,
    config?: WriteConfig,
  ): Promise<TResult> => {
    const { validate = baseValidate, ...axiosCfg } = config ?? {};

    const ctx = parseIf(validate, (schemas as any)?.context, context);
    const parsedBody =
      body && schemas && 'body' in (schemas as object)
        ? parseIf(validate, (schemas as any).body, body)
        : body;

    const data = await raw(ctx as any, parsedBody ?? undefined, axiosCfg);
    return parseIf(validate, (schemas as any)?.response, data);
  };
}

/* ---------- Output type từ config ---------- */
type FunctionFromEndpoint<N extends EndpointNode<any, any>> = N['method'] extends 'get' | 'delete'
  ? <
      TResult = InferOr<
        N['schemas'] extends { response: infer R extends ZodType } ? R : undefined,
        unknown
      >,
      TQuery = InferOr<
        N['schemas'] extends { query: infer Q extends ZodType } ? Q : undefined,
        unknown
      >,
    >(
      ctx: PathParams<N['path']>,
      options?: ReadConfig<TQuery>,
    ) => Promise<TResult>
  : <
      TResult = InferOr<
        N['schemas'] extends { response: infer R2 extends ZodType } ? R2 : undefined,
        unknown
      >,
      TBody = InferOr<
        N['schemas'] extends { body: infer B extends ZodType } ? B : undefined,
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
    : { [K in keyof C]: ApiFromConfig<C[K]> };

/* ---------- Public builder ---------- */
export function buildApi<C extends ConfigTree>(config: C): ApiFromConfig<C> {
  const isEndpoint = (n: any): n is EndpointNode<string, Method> =>
    n && typeof n === 'object' && 'method' in n && 'path' in n;

  const walk = (node: any): any => {
    if (isEndpoint(node)) {
      const { method, path, schemas, validate } = node;
      return createEndpoint<any, any, any>(method as any, path as any, schemas as any, {
        validate,
      });
    }
    if (node && typeof node === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(node)) out[k] = walk(node[k]);
      return out;
    }
    throw new Error('Invalid config node.');
  };

  return walk(config);
}

/* ---------- Exports tiện dụng ---------- */
export type {
  ZodType as ZodAny,
  QuerySchemas,
  BodySchemas,
  Schemas,
  EndpointNode,
  ConfigTree,
  ReadConfig as RequestOptions,
  WriteConfig,
};
