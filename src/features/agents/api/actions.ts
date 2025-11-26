// agents.actions.ts
import { queryOptions, mutationOptions } from '@tanstack/react-query';
import { agentKeys } from './keys';
import { agentApi } from './http';
import { AnalysisCreateInput, DataSourceCreateInput } from '@/contracts/agents/agents.input';

// ---- Queries
export const listAgentsQueryOptions = (params?: { workspaceId?: string }) => {
  console.log('params', params);
  return queryOptions({
    queryKey: agentKeys.list(),
    queryFn: () => agentApi.list(), // <-- truyền AbortSignal
    select: (r) => r.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
export const getAgentQueryOptions = ({ agentId }: { agentId: string }) =>
  queryOptions({
    queryKey: agentKeys.detail(agentId),
    queryFn: () => agentApi.get({ agentId }),
    select: (r) => r.data,
    staleTime: 5 * 60 * 1000,
  });

// ---- Mutations
export const createAgentMutationOptions = () =>
  mutationOptions({
    mutationKey: ['agent', 'create'],
    mutationFn: agentApi.create,
    meta: { invalidateQueries: [agentKeys.list()] },
  });

export const updateAgentMutationOptions = ({ agentId }: { agentId: string }) => {
  return mutationOptions({
    mutationKey: ['agent', 'update', agentId],
    mutationFn: (data: { name?: string; description?: string }) =>
      agentApi.update({ agentId }, data),
    meta: { invalidateQueries: [agentKeys.detail(agentId), agentKeys.list()] },
  });
};

export const deleteAgentMutationOptions = ({ agentId }: { agentId: string }) =>
  mutationOptions({
    mutationKey: ['agent', 'delete', agentId],
    mutationFn: () => agentApi.delete({ agentId }),
    meta: { invalidateQueries: [agentKeys.list(), agentKeys.sources(agentId)] },
  });

// ---- Sources
export const listAgentSourcesQueryOptions = ({ agentId }: { agentId: string }) =>
  queryOptions({
    queryKey: agentKeys.sources(agentId),
    queryFn: () => agentApi.sources.list({ agentId }),
    select: (r) => r.data,
    staleTime: 5 * 60 * 1000,
  });

export const createSourceMutationOptions = ({ agentId }: { agentId: string }) =>
  mutationOptions({
    mutationKey: ['agent-sources', 'create', agentId],
    mutationFn: (data: DataSourceCreateInput) => agentApi.sources.create({ agentId }, data),
    meta: { invalidateQueries: [agentKeys.sources(agentId)] },
  });

export const uploadSourceMutationOptions = ({ agentId }: { agentId: string }) =>
  mutationOptions({
    mutationKey: ['agent-sources', 'upload', agentId],
    mutationFn: async ({ file }: { file: File }) => {
      const form = new FormData();
      form.append('file', file);
      // Không set Content-Type thủ công để browser tự thêm boundary
      return agentApi.sources.upload({ agentId }, form);
    },
    meta: { invalidateQueries: [agentKeys.sources(agentId)] },
  });

export const deleteSourceMutationOptions = (params: { agentId: string; sourceId: string }) =>
  mutationOptions({
    mutationKey: ['agent-sources', 'delete', params.agentId, params.sourceId],
    mutationFn: () => agentApi.sources.delete(params),
    meta: { invalidateQueries: [agentKeys.sources(params.agentId)] },
  });

// ---- Analyses (polling động)
export const listAgentAnalysesQueryOptions = ({ agentId }: { agentId: string }) =>
  queryOptions({
    queryKey: agentKeys.analyses(agentId),
    queryFn: () => agentApi.analyses.list({ agentId }),
    select: (r) => r.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    // chỉ poll khi còn job RUNNING
    refetchInterval: (data) =>
      Array.isArray(data) && data.some((a) => a.status === 'RUNNING') ? 10_000 : false,
  });

export const createAgentAnalysisMutationOptions = ({ agentId }: { agentId: string }) =>
  mutationOptions({
    mutationKey: ['agent-analyses', 'create', agentId],
    mutationFn: (data: AnalysisCreateInput) => agentApi.analyses.create({ agentId }, data),
    meta: { invalidateQueries: [agentKeys.analyses(agentId)] },
  });

export const deleteAgentAnalysisMutationOptions = ({ agentId }: { agentId: string }) =>
  mutationOptions({
    mutationKey: ['agent-analyses', 'delete', agentId],
    mutationFn: ({ analysisId }: { analysisId: string }) =>
      agentApi.analyses.delete({ agentId, analysisId }),
    meta: { invalidateQueries: [agentKeys.analyses(agentId), agentKeys.sources(agentId)] },
  });
