import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

export const useRouterRequired = () => {
  const router = useRouter();
  if (!router) throw new Error('router is undefined');
  return router;
};

export const useSearchParamsRequired = () => {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('searchParams is undefined');
  return searchParams;
};

export const useParamsRequired = <
  T extends Record<string, string | string[]> = Record<string, string | string[]>,
>() => {
  const params = useParams<T>();
  if (!params) throw new Error('params is undefined');
  return params;
};

export const usePathnameRequired = () => {
  const pathname = usePathname();
  if (!pathname) throw new Error('pathname is undefined');
  return pathname;
};
