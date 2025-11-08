import {
  AgentItemOutput,
  ListAgentOutput,
  ListDataSourceOutput,
  DataSourceItemOutput,
  ListAnalysisOutput,
  AnalysisItemOutput,
  AIAgentCreateInput,
  AnalysisCreateInput,
  DataSourceCreateInput,
} from '@/contracts/agents';
import { baseApi, PathParams } from '@/lib/api';

const AgentBaseURL = 'v2/agents' as const;
const AgentItemURL = `${AgentBaseURL}/{agentId}` as const;

const BaseSourceURL = `${AgentItemURL}/sources` as const;
const SourceItemURL = `${BaseSourceURL}/{sourceId}` as const;

const BaseAnalysisURL = `${AgentItemURL}/analyses` as const;
const AnalysisItemURL = `${BaseAnalysisURL}/{analysisId}` as const;

const AgentEndpoints = {
  list: AgentBaseURL,
  get: AgentItemURL,
  create: AgentBaseURL,
  delete: AgentItemURL,
  update: AgentItemURL,

  sources: {
    list: BaseSourceURL,
    create: BaseSourceURL,
    delete: SourceItemURL,
    update: SourceItemURL,
    upload: `${BaseSourceURL}/upload` as const,
  },

  analyses: {
    list: BaseAnalysisURL,
    get: AnalysisItemURL,
    create: BaseAnalysisURL,
    delete: AnalysisItemURL,
    update: AnalysisItemURL,
  },
};

export type AgentCtx = PathParams<typeof AgentItemURL>;
export type SourceCtx = PathParams<typeof SourceItemURL>;

export const agentApi = {
  list: () => baseApi.get<ListAgentOutput>(AgentEndpoints.list),
  get: (ctx: AgentCtx) => baseApi.get<AgentItemOutput>(AgentEndpoints.get, ctx),
  create: (data: AIAgentCreateInput) => baseApi.post<AgentItemOutput>(AgentEndpoints.create, data),
  delete: (ctx: AgentCtx) => baseApi.delete(AgentEndpoints.delete, ctx),
  update: (ctx: AgentCtx, data: any) =>
    baseApi.patch<AgentItemOutput>(AgentEndpoints.update, data, ctx),

  sources: {
    list: (ctx: AgentCtx) => baseApi.get<ListDataSourceOutput>(AgentEndpoints.sources.list, ctx),
    create: (ctx: AgentCtx, data: DataSourceCreateInput, options?: any) =>
      baseApi.post<DataSourceItemOutput>(AgentEndpoints.sources.create, data, ctx, options),
    delete: (ctx: SourceCtx) => baseApi.delete(AgentEndpoints.sources.delete, ctx),
    update: (ctx: SourceCtx, data: any) => baseApi.patch(AgentEndpoints.sources.update, data, ctx),
    upload: (ctx: AgentCtx, data: FormData, options?: any) =>
      baseApi.post(AgentEndpoints.sources.upload, data, ctx, options),
  },

  analyses: {
    list: (ctx: AgentCtx) => baseApi.get<ListAnalysisOutput>(AgentEndpoints.analyses.list, ctx),
    get: (ctx: PathParams<typeof AnalysisItemURL>) =>
      baseApi.get<AnalysisItemOutput>(AgentEndpoints.analyses.get, ctx),
    create: (ctx: AgentCtx, data: AnalysisCreateInput) =>
      baseApi.post<AnalysisItemOutput>(AgentEndpoints.analyses.create, data, ctx),
    delete: (ctx: PathParams<typeof AnalysisItemURL>) =>
      baseApi.delete(AgentEndpoints.analyses.delete, ctx),
    update: (ctx: PathParams<typeof AnalysisItemURL>, data: any) =>
      baseApi.patch(AgentEndpoints.analyses.update, data, ctx),
  },
};
