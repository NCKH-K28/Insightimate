import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import qs from 'qs';
import { ProjectQueryParams, ZProjectQueryParams } from '@/contracts/projects';
import React from 'react';

const projectQs = {
  stringify: (query: ProjectQueryParams) => {
    return qs.stringify(query, {
      addQueryPrefix: true,
      arrayFormat: 'brackets',
      encode: false,
      skipNulls: true,
    });
  },
  parse: (queryString: string): ProjectQueryParams => {
    const parsed = qs.parse(queryString, { ignoreQueryPrefix: true });
    return ZProjectQueryParams.parse(parsed);
  },
};

export const useProjectsQueryParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!pathname) throw new Error('Missing pathname');
  if (!searchParams) throw new Error('Missing search params');

  const setQuery = React.useCallback(
    (query: Partial<ProjectQueryParams>, options?: { replace?: boolean }) => {
      const current = projectQs.parse(searchParams.toString());
      if (options?.replace == true) {
        const queryString = projectQs.stringify(query);
        router.replace(`${pathname}${queryString}`);
      } else {
        const merged = { ...current, ...query };
        const queryString = projectQs.stringify(merged);
        router.replace(`${pathname}${queryString}`);
      }
    },
    [searchParams, pathname, router],
  );

  const query = React.useMemo(() => {
    const search = searchParams.toString();
    return projectQs.parse(search);
  }, [searchParams]);

  return { query, setQuery };
};
