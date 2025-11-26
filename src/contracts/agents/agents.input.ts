import { z } from 'zod';
import { ZAIAgent, ZDataSource, ZAnalysis } from './agent';

// ===== AI Agent Input/Output Schemas =====
export const ZAIAgentCreateInput = ZAIAgent.pick({
  name: true,
  description: true,
  workspaceId: true,
  model: true,
  instructions: true,
  configuration: true,
  tags: true,
});

export const ZAIAgentUpdateInput = ZAIAgentCreateInput.partial();

export type AIAgentUpdateInput = z.infer<typeof ZAIAgentUpdateInput>;
export type AIAgentCreateInput = z.infer<typeof ZAIAgentCreateInput>;

// ===== Data Source Input/Output Schemas =====
export const ZDataSourceCreateInput = ZDataSource.pick({
  agentId: true,
  sourceType: true,
  sourceId: true,
});
export const ZDataSourceUpdateInput = ZDataSourceCreateInput.partial();

export type DataSourceCreateInput = z.infer<typeof ZDataSourceCreateInput>;
export type DataSourceUpdateInput = z.infer<typeof ZDataSourceUpdateInput>;

// ===== Analysis Input/Output Schemas =====
export const ZAnalysisCreateInput = ZAnalysis.pick({ dataSourceId: true, type: true });
export const ZAnalysisUpdateInput = ZAnalysisCreateInput.partial();

export type AnalysisCreateInput = z.infer<typeof ZAnalysisCreateInput>;
export type AnalysisUpdateInput = z.infer<typeof ZAnalysisUpdateInput>;

// for source
// export const ZAIAgentListInput = z.object({
//   filter: z
//     .object({ workspaceId: z.string().min(1, 'Workspace ID is required').optional() })
//     .optional(),
// });

// export type AIAgentListInput = z.infer<typeof ZAIAgentListInput>;

// export const ZAgentItem = ZAIAgent;
// export const ZDataSourceItem = ZDataSource;
// export const ZAnalysisItem = ZAnalysis;

// export const ZListAgentOutput = z.object({
//   data: z.array(ZAgentItem),
//   meta: z.unknown(),
// });

// export const ZListDataSourceOutput = z.object({
//   data: z.array(ZDataSourceItem),
//   meta: z.unknown(),
// });

// export const ZListAnalysisOutput = z.object({
//   data: z.array(ZAnalysisItem),
//   meta: z.unknown(),
// });

// export type AgentItemOutput = z.infer<typeof ZAgentItem>;
// export type DataSourceItemOutput = z.infer<typeof ZDataSourceItem>;
// export type AnalysisItemOutput = z.infer<typeof ZAnalysisItem>;

// export type ListAgentOutput = z.infer<typeof ZListAgentOutput>;
// export type ListDataSourceOutput = z.infer<typeof ZListDataSourceOutput>;
// export type ListAnalysisOutput = z.infer<typeof ZListAnalysisOutput>;

// export const ZSourceListInput = z.object({
//   filter: z
//     .object({
//       agentId: z.string().describe('Agent ID to filter sources by'),
//       q: z.string().optional().describe('Search term for filtering sources'),
//     })
//     .partial()
//     .optional(),
// });

// export type SourceListInput = z.infer<typeof ZSourceListInput>;
