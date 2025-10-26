import { z } from 'zod';

const ZRecordAny = z.record(z.string(), z.any());
export const ZSourceType = z.enum(['PROJECT', 'FILE']);
export const ZAnalysisStatus = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'READY']);
export const ZSourceStatus = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'READY']);

export const ZAIAgent = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Agent name is required'),
  description: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  configuration: ZRecordAny.optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
});

export const ZFileReference = z.object({
  id: z.string().min(1, 'File ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileURL: z.string(),
  metadata: ZRecordAny.optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
});

export const ZDataSource = z.object({
  id: z.string().min(1, 'Data Source ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  sourceType: ZSourceType,
  sourceId: z.string().min(1, 'Source ID is required'),
  status: ZSourceStatus,
  snapshot: z.record(z.string(), z.any()).optional(),
  isHidden: z.boolean().optional(),

  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
});

export const ZAnalysis = z.object({
  id: z.string().min(1, 'Analysis ID is required'),
  dataSourceId: z.string().min(1, 'Data Source ID is required').optional(),
  runStatus: ZAnalysisStatus,
  output: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
  processedAt: z.iso.datetime().optional(),
});

export type AIAgent = z.infer<typeof ZAIAgent>;
export type FileReference = z.infer<typeof ZFileReference>;
export type DataSource = z.infer<typeof ZDataSource>;
export type Analysis = z.infer<typeof ZAnalysis>;

// ========================== Input Schemas ==========================
export const ZAIAgentCreateInput = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  leadId: z.string().min(1, 'Lead ID is required'),
});

export const ZDataSourceCreateInput = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  sourceType: ZSourceType,
  sourceId: z.string().min(1, 'Source ID is required'),
});

export const ZAnalysisCreateInput = z.object({
  dataSourceId: z.string().min(1, 'Data Source ID is required'),
});

export type AIAgentCreateInput = z.infer<typeof ZAIAgentCreateInput>;
export type DataSourceCreateInput = z.infer<typeof ZDataSourceCreateInput>;
export type AnalysisCreateInput = z.infer<typeof ZAnalysisCreateInput>;

export const ZAIAgentListInput = z.object({
  filter: z
    .object({ workspaceId: z.string().min(1, 'Workspace ID is required').optional() })
    .optional(),
});

export type AIAgentListInput = z.infer<typeof ZAIAgentListInput>;

// for source

export const ZSourceCreateInput = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  sourceType: ZSourceType,
  sourceId: z.string().min(1, 'Source ID is required'),
});

export type SourceCreateInput = z.infer<typeof ZSourceCreateInput>;
