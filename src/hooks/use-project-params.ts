import React from 'react';
import qs from 'qs';
import z from 'zod';
import { issueQueryParamsSchema } from '../../.temp/schemas/issue';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

const projectParamsSchema = z.object({
  projectId: z.string(),
  viewMode: z.enum(['summary', 'backlog', 'board', 'list', 'calendar', 'timeline']).nullable(),
  issueParams: issueQueryParamsSchema,
  selectedIssue: z.string().nullable(),
});

type ProjectParams = z.infer<typeof projectParamsSchema>;
const defaultParams: ProjectParams = Object.freeze({
  issueParams: { pageIndex: 0, pageSize: 10 },
  selectedIssue: null,
  selectedSprint: null,
  projectId: '',
  viewMode: null,
});

export const useProjectParams = (params: Partial<ProjectParams> = defaultParams) => {
  const [projectParams, setProjectParams] = React.useState<ProjectParams>(defaultParams);

  const queryParams = useParams<{ projectId?: string; viewMode?: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectId = queryParams.projectId;
  if (!projectId) throw new Error('Missing "projectId" in URL parameters');

  React.useEffect(() => {
    const currentParams = qs.parse(searchParams.toString());
    const mergedParams = { ...defaultParams, ...currentParams, ...params };
    const valid = projectParamsSchema.safeParse(mergedParams);

    if (valid.success) {
      setProjectParams(valid.data);
    } else {
      console.warn('Invalid issue query parameters:', valid.error);
      setProjectParams({ ...defaultParams });
    }
  }, [searchParams, params]);

  React.useEffect(() => {
    const { issueParams } = projectParams;
    const isDefault = JSON.stringify(issueParams) === JSON.stringify(defaultParams.issueParams);
    if (isDefault) return;
    const queryString = qs.stringify(issueParams, {
      addQueryPrefix: true,
      arrayFormat: 'brackets',
      encode: false,
      skipNulls: true,
    });
    const newUrl = `${pathname}${queryString}`;
    router.replace(newUrl);
  }, [projectParams.issueParams, pathname, router]);

  const validViewModes = ['summary', 'backlog', 'board', 'list', 'calendar', 'timeline'] as const;
  const viewMode = React.useMemo(() => {
    const mode = queryParams.viewMode;
    if (!mode) return null;
    const modeType = mode as (typeof validViewModes)[number];
    return validViewModes.includes(modeType) ? modeType : 'summary';
  }, [queryParams.viewMode]);

  return {
    projectId,
    viewMode,
    projectParams,
    setProjectParams,
  };
};
