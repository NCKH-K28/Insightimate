import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { agentApi } from './http';
import { AIAgentCreateInput, AnalysisCreateInput, DataSourceCreateInput } from '@/contracts/agents';

// ============ Agents ============
export const listAgentsQueryOptions = () => {
  return queryOptions({
    queryKey: ['agents'],
    queryFn: agentApi.list,
    select: ({ data }) => data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const getAgentQueryOptions = (params: { agentId: string }) => {
  return queryOptions({
    queryKey: ['agent', params.agentId],
    queryFn: () => agentApi.get({ agentId: params.agentId }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const createAgentMutationOptions = () => {
  return mutationOptions({
    mutationFn: (data: AIAgentCreateInput) => agentApi.create(data),
    meta: { invalidateQueries: [['agents']] },
  });
};

export const deleteAgentMutationOptions = (params?: { agentId?: string }) => {
  return mutationOptions({
    mutationFn: (p?: { agentId?: string }) => {
      const agentId = p?.agentId || params?.agentId;
      if (!agentId) throw new Error('Agent ID is required for deletion');
      return agentApi.delete({ agentId });
    },
    meta: { invalidateQueries: [['agent-sources'], ['agents', { workspaceId: params?.agentId }]] },
  });
};

export const updateAgentMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: (data: { name?: string; description?: string }) =>
      agentApi.update({ agentId: params.agentId }, data),
    meta: { invalidateQueries: [['agent', params.agentId]] },
  });
};

// ============ Agent Sources ============
export const listAgentSourcesQueryOptions = (params: { agentId: string }) => {
  return queryOptions({
    queryKey: ['agent-sources', params.agentId],
    queryFn: async () => {
      const res: any = await agentApi.sources.list({ agentId: params.agentId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const createSourceMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: (data: DataSourceCreateInput) =>
      agentApi.sources.create({ agentId: params.agentId }, data),
    meta: { invalidateQueries: [['agent-sources', params.agentId]] },
  });
};

export const uploadSourceMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: async (data: { file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      const res = await agentApi.sources.upload({ agentId: params.agentId }, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res;
    },
    meta: { invalidateQueries: [['agent-sources', params.agentId]] },
  });
};

export const deleteSourceMutationOptions = (params: { agentId: string; sourceId?: string }) => {
  return mutationOptions({
    mutationFn: (data?: { sourceId?: string }) => {
      const sourceId = data?.sourceId || params.sourceId;
      if (!sourceId) throw new Error('Source ID is required for deletion');
      return agentApi.sources.delete({ agentId: params.agentId, sourceId });
    },
    meta: { invalidateQueries: [['agent-sources', params.agentId]] },
  });
};

export const updateSourceMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: (data: { sourceId: string; sourceType?: string }) =>
      agentApi.sources.update(
        { agentId: params.agentId, sourceId: data.sourceId },
        { sourceType: data.sourceType },
      ),
    meta: { invalidateQueries: [['agent-sources', params.agentId]] },
  });
};

// ============ Agent Analyses ============
export const listAgentAnalysesQueryOptions = (params: { agentId: string }) => {
  return queryOptions({
    queryKey: ['agent-analyses', params.agentId],
    queryFn: () => agentApi.analyses.list({ agentId: params.agentId }).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 1000, // 10 seconds
  });
};

export const getAgentAnalysisQueryOptions = (params: { agentId: string; analysisId: string }) => {
  return queryOptions({
    queryKey: ['agent-analysis', params.agentId, params.analysisId],
    queryFn: () =>
      agentApi.analyses.get({ agentId: params.agentId, analysisId: params.analysisId }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const createAgentAnalysisMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: (data: AnalysisCreateInput) => {
      return agentApi.analyses.create({ agentId: params.agentId }, data);
    },
    meta: { invalidateQueries: [['agent-analyses', params.agentId]] },
  });
};

export const deleteAgentAnalysisMutationOptions = (params: {
  agentId: string;
  analysisId?: string;
}) => {
  return mutationOptions({
    mutationFn: (data?: { analysisId?: string }) => {
      const analysisId = data?.analysisId || params.analysisId;
      if (!analysisId) throw new Error('Analysis ID is required for deletion');
      return agentApi.analyses.delete({ agentId: params.agentId, analysisId });
    },
    meta: { invalidateQueries: [['agent-analyses', params.agentId]] },
  });
};

export const updateAgentAnalysisMutationOptions = (params: { agentId: string }) => {
  return mutationOptions({
    mutationFn: (data: { analysisId: string; status?: string }) =>
      agentApi.analyses.update(
        { agentId: params.agentId, analysisId: data.analysisId },
        { status: data.status },
      ),
    meta: { invalidateQueries: [['agent-analyses', params.agentId]] },
  });
};
