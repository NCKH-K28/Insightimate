import { z } from 'zod';
import { ZAIAgent, ZDataSource, ZAnalysis } from './agent';

const ZOwner = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatar: z.string().nullable(),
});

// ===== AI Agent List Input/Output Schemas =====
const ZAgentFilter = z.object({ workspaceId: z.string().optional() });
export const ZAgentItem = ZAIAgent.extend({ owner: ZOwner.optional() });
export const ZAgentItemOutput = z.object({ data: ZAgentItem });
export const ZAgentListInput = z.object({ filter: ZAgentFilter.optional() });
export const ZListAgentOutput = z.object({ data: z.array(ZAgentItem), meta: z.unknown() });

export type AIAgentItem = z.infer<typeof ZAgentItem>;
export type AIAgentListInput = z.infer<typeof ZAgentListInput>;
export type AIAgentListOutput = z.infer<typeof ZListAgentOutput>;
export type AIAgentItemOutput = z.infer<typeof ZAgentItemOutput>;

// ===== Data Source List Input/Output Schemas =====
const ZDataSourceFilter = z.object({ agentId: z.string().optional() });
export const ZDataSourceItem = ZDataSource;
export const ZDataSourceItemOutput = z.object({ data: ZDataSourceItem });
export const ZDataSourceListInput = z.object({ filter: ZDataSourceFilter.optional() });
export const ZListDataSourceOutput = z.object({
  data: z.array(ZDataSourceItem),
  meta: z.unknown(),
});

export type DataSourceItem = z.infer<typeof ZDataSourceItem>;
export type DataSourceItemOutput = z.infer<typeof ZDataSourceItemOutput>;
export type DataSourceListInput = z.infer<typeof ZDataSourceListInput>;
export type DataSourceListOutput = z.infer<typeof ZListDataSourceOutput>;

// ===== Analysis List Input/Output Schemas =====
const ZAnalysisFilter = z.object({ dataSourceId: z.string().optional() });

export const ZAnalysisItem = ZAnalysis;
export const ZAnalysisItemOutput = z.object({ data: ZAnalysisItem });
export const ZAnalysisListInput = z.object({ filter: ZAnalysisFilter.optional() });
export const ZListAnalysisOutput = z.object({
  data: z.array(ZAnalysisItem),
  meta: z.unknown(),
});

export type AnalysisItem = z.infer<typeof ZAnalysisItem>;
export type AnalysisItemOutput = z.infer<typeof ZAnalysisItemOutput>;
export type AnalysisListInput = z.infer<typeof ZAnalysisListInput>;
export type AnalysisListOutput = z.infer<typeof ZListAnalysisOutput>;
