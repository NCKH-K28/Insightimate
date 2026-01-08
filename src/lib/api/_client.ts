import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';

// ==================== Types ====================
type ExtractKeys<S extends string> = S extends `${string}{${infer K}}${infer R}`
  ? K | ExtractKeys<R>
  : never;

export type PathParams<S extends string> = Record<ExtractKeys<S>, string | number | boolean>;

type Method = 'get' | 'delete' | 'post' | 'put' | 'patch';
type ReadMethod = 'get' | 'delete';

// ==================== URL Builder ====================
export function buildURL<const T extends string>(template: T, params?: PathParams<T>): string {
  const missing: string[] = [];

  const url = template.replace(/{([^}]+)}/g, (_, key: string) => {
    const value = (params as Record<string, unknown>)?.[key];
    if (value == null || value === '') {
      missing.push(key);
      return '';
    }
    return encodeURIComponent(String(value));
  });

  if (missing.length) {
    throw new Error(`Missing parameters: ${missing.join(', ')} in URL template: ${template}`);
  }

  return url;
}

// ==================== Axios Instance ====================
const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 40000,
  paramsSerializer: (params) =>
    qs.stringify(params, { arrayFormat: 'brackets', skipNulls: true, encodeValuesOnly: true }),
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error),
);

// ==================== Helpers ====================
const unwrap = <T>(promise: Promise<AxiosResponse<T>>): Promise<T> =>
  promise.then((res) => ((res as any).unwrapped ?? res.data) as T);

export const request = <T, U extends string>(
  method: Method,
  url: U,
  pathParams?: PathParams<U>,
  bodyOrConfig?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const builtUrl = buildURL(url, pathParams);

  const isRead = method === 'get' || method === 'delete';
  const axiosConfig = isRead ? (bodyOrConfig as AxiosRequestConfig) : config;
  const body = isRead ? undefined : bodyOrConfig;

  return unwrap<T>(
    isRead
      ? axiosInstance[method]<T>(builtUrl, axiosConfig)
      : axiosInstance[method]<T>(builtUrl, body, axiosConfig),
  );
};

// ==================== Base API ====================
export const baseApi = {
  get: <T, U extends string = string>(
    url: U,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => request<T, U>('get', url, pathParams, config),

  post: <T, U extends string = string>(
    url: U,
    body?: unknown,
    params?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => request<T, U>('post', url, params, body, config),

  put: <T, U extends string = string>(
    url: U,
    body?: unknown,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => request<T, U>('put', url, pathParams, body, config),

  patch: <T, U extends string = string>(
    url: U,
    body?: unknown,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => request<T, U>('patch', url, pathParams, body, config),

  delete: <T, U extends string = string>(
    url: U,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => request<T, U>('delete', url, pathParams, config),

  buildMethod<TPath extends string>(path: TPath, method: Method) {
    const isRead = (m: Method): m is ReadMethod => m === 'get' || m === 'delete';

    if (isRead(method)) {
      return <TResult = unknown, TQuery = unknown>(
        pathParams: PathParams<TPath>,
        config?: Omit<AxiosRequestConfig, 'params'> & { params?: TQuery },
      ): Promise<TResult> =>
        unwrap<TResult>(axiosInstance[method]<TResult>(buildURL(path, pathParams), config));
    }

    return <TResult = unknown, TBody = unknown>(
      pathParams: PathParams<TPath>,
      body?: TBody,
      config?: AxiosRequestConfig,
    ): Promise<TResult> => {
      // log config
      console.log('Request Config:', { path, method, pathParams, body, config });
      return unwrap<TResult>(
        axiosInstance[method]<TResult>(buildURL(path, pathParams), body, config),
      );
    };
  },
};

export default axiosInstance;
