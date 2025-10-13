import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';

// ==================== URL Template Builder ====================
type ExtractKeys<S extends string> = S extends `${string}{${infer K}}${infer R}`
  ? K | ExtractKeys<R>
  : never;
export type PathParams<S extends string> = Record<ExtractKeys<S>, string | number | boolean>;

export function buildURL<const T extends string>(template: T, params: PathParams<T>): string;
export function buildURL(
  template: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): string;
export function buildURL(
  template: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const missing: string[] = [];
  const out = template.replace(/{([^}]+)}/g, (_m, rawKey: string) => {
    const v = (params as any)[rawKey];
    if (v === undefined || v === null || v === '') {
      missing.push(rawKey);
      return ''; // sẽ throw phía dưới
    }
    return encodeURIComponent(String(v));
  });
  if (missing.length) {
    throw new Error(`Missing parameters: ${missing.join(', ')} in URL template: ${template}`);
  }
  return out;
}

// ==================== Base Axios Instance ====================
// axios instance
const axiosInstance = axios.create({
  baseURL: '/api',
  // headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // FIXME: cân nhắc token-based
  timeout: 15000,
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: 'brackets',
      skipNulls: true,
      encodeValuesOnly: true,
      // allowDots: true, // hỗ trợ nested query
    }),
});

// chỉ flatten khi thật sự có { data: ... }
axiosInstance.interceptors.response.use(
  (res) => {
    // const d = res.data;
    // if (d && typeof d === 'object' && 'data' in d) {
    //   // Giữ nguyên res để debug khi cần, nhưng return .data ở helper
    //   (res as any).unwrapped = d.data;
    // }
    return res;
  },
  (error) => Promise.reject(error),
);

// helper chung để luôn trả payload T
const unwrap = async <T>(p: Promise<AxiosResponse<T>>): Promise<T> => {
  return p.then((res) => ((res as any).unwrapped ?? res.data) as T);
};

export const baseApi = {
  get: <T, U extends string = string>(
    url: U,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => unwrap<T>(axiosInstance.get(buildURL(url, pathParams), config)),
  post: <T, U extends string = string>(
    url: U,
    body?: unknown,
    params?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => unwrap<T>(axiosInstance.post(buildURL(url, params), body, config)),
  put: <T, U extends string = string>(
    url: U,
    body?: unknown,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => unwrap<T>(axiosInstance.put(buildURL(url, pathParams), body, config)),
  patch: <T, U extends string = string>(
    url: U,
    body?: unknown,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => unwrap<T>(axiosInstance.patch(buildURL(url, pathParams), body, config)),
  delete: <T, U extends string = string>(
    url: U,
    pathParams?: PathParams<U>,
    config?: AxiosRequestConfig,
  ) => unwrap<T>(axiosInstance.delete(buildURL(url, pathParams), config)),

  buildMethod<TPath extends string>(
    path: TPath,
    method: 'get' | 'delete' | 'post' | 'put' | 'patch',
  ) {
    if (method === 'get') {
      return function <TResult = unknown, TQuery = unknown>(
        pathParams: PathParams<TPath>,
        config?: Omit<AxiosRequestConfig, 'params'> & { params?: TQuery },
      ): Promise<TResult> {
        return unwrap<TResult>(axiosInstance.get<TResult>(buildURL(path, pathParams), config));
      };
    }

    if (method === 'delete') {
      return function <TResult = unknown, TQuery = unknown>(
        pathParams: PathParams<TPath>,
        config?: Omit<AxiosRequestConfig, 'params'> & { params?: TQuery },
      ): Promise<TResult> {
        return unwrap<TResult>(axiosInstance.delete<TResult>(buildURL(path, pathParams), config));
      };
    }

    if (method === 'post') {
      return function <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body?: TBody,
        config?: AxiosRequestConfig,
      ): Promise<TResult> {
        return unwrap<TResult>(
          axiosInstance.post<TResult>(buildURL(path, pathParams), body, config),
        );
      };
    }

    if (method === 'put') {
      return function <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body?: TBody,
        config?: AxiosRequestConfig,
      ): Promise<TResult> {
        return unwrap<TResult>(
          axiosInstance.put<TResult>(buildURL(path, pathParams), body, config),
        );
      };
    }

    if (method === 'patch') {
      return function <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body?: TBody,
        config?: AxiosRequestConfig,
      ): Promise<TResult> {
        return unwrap<TResult>(
          axiosInstance.patch<TResult>(buildURL(path, pathParams), body, config),
        );
      };
    }

    throw new Error(`Unsupported method: ${method}`);
  },

  makePathApi<TPath extends string>(path: TPath) {
    return {
      get: <TResult = unknown, TQuery = unknown>(
        pathParams: PathParams<TPath>,
        config?: Omit<AxiosRequestConfig, 'params'> & { params?: TQuery },
      ) => baseApi.get<TResult, TPath>(path, pathParams, config),

      delete: <TResult = unknown, TQuery = unknown>(
        pathParams: PathParams<TPath>,
        config?: Omit<AxiosRequestConfig, 'params'> & { params?: TQuery },
      ) => baseApi.delete<TResult, TPath>(path, pathParams, config),

      post: <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body: TBody,
        config?: AxiosRequestConfig,
      ) => baseApi.post<TResult, TPath>(path, body, pathParams, config),

      put: <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body: TBody,
        config?: AxiosRequestConfig,
      ) => baseApi.put<TResult, TPath>(path, body, pathParams, config),

      patch: <TResult = unknown, TBody = unknown>(
        pathParams: PathParams<TPath>,
        body: TBody,
        config?: AxiosRequestConfig,
      ) => baseApi.patch<TResult, TPath>(path, body, pathParams, config),
    };
  },
};

export default axiosInstance;
