import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceQueryOptions } from '@/features/workspaces/api/actions';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import axiosInstance from '@/lib/api/_client';
import { SprintItem } from '@/contracts/boards/boards.query';

export const useDefaultContexts = () => {
  const params = useParams<{
    workspaceId?: string;
    projectId?: string;
    issueId?: string;
    sprintId?: string;
  }>();
  if (!params) throw new Error('Params not found');

  const { data: _workspace } = useQuery({
    ...getWorkspaceQueryOptions({ workspaceId: params.workspaceId || '' }),
    enabled: !!params.workspaceId,
  });

  const { data: project } = useQuery({
    ...getProjectQueryOptions({ projectId: params.projectId || '' }),
    enabled: !!params.projectId,
  });

  const { data: sprint } = useQuery({
    queryKey: ['sprints', params.sprintId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/v2/sprints/${params.sprintId}`);
      const data = res.data;
      return data as SprintItem;
    },
    enabled: !!params.sprintId,
  });

  const contexts: {
    id: string;
    name: string;
    type: 'file' | 'sprint' | 'issue' | 'project';
    label: string;
    value: string;
    isLoading?: boolean;
    iconURL?: string;
    meta?: unknown;
  }[] = [];
  if (project) {
    contexts.push({
      id: project.id,
      type: 'project',
      name: project.name,
      iconURL: project.avatar,
      value: project.id,
      label: project.name,
    });
  }
  if (params.issueId) {
    contexts.push({
      id: params.issueId,
      type: 'issue',
      name: 'Issue',
      value: params.issueId,
      label: 'Issue',
    });
  }
  if (sprint) {
    contexts.push({
      id: sprint.id,
      type: 'sprint',
      name: sprint.name,
      value: sprint.id,
      label: sprint.name,
    });
  }

  return contexts;
};
