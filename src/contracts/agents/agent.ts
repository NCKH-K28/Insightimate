import { isoDateString } from '../common';
import { z } from 'zod';

const ZIsoDate = isoDateString;
const ZAgentId = z.string().min(1, 'Agent ID is required');
const ZFileId = z.string().min(1, 'File ID is required');
const ZSourceId = z.string().min(1, 'Source ID is required');
const ZAnalysisId = z.string().min(1, 'Analysis ID is required');
const ZWorkspaceId = z.string().min(1, 'Workspace ID is required');
const ZOwnerId = z.string().min(1, 'Owner ID is required');

const ZRecordAny = z.record(z.string(), z.any());

export const ZSourceType = z.enum(['PROJECT', 'FILE']);
export const ZAnalysisStatus = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'READY']);
export const ZSourceStatus = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'READY']);

export const ZAIAgent = z.object({
  id: ZAgentId,
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().optional(),
  workspaceId: ZWorkspaceId,
  ownerId: ZOwnerId,
  configuration: ZRecordAny.optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  model: z.string().optional(),
  createdAt: ZIsoDate.optional(),
  updatedAt: ZIsoDate.optional(),
});

export const ZFileReference = z.object({
  id: ZFileId,
  fileName: z.string(),
  key: z.string(),
  url: z.string().optional(),
  metadata: ZRecordAny.optional(),
  createdAt: ZIsoDate.optional(),
  updatedAt: ZIsoDate.optional(),
});

export const ZDataSource = z.object({
  id: ZSourceId,
  agentId: ZAgentId,
  sourceType: ZSourceType,
  sourceId: ZSourceId,
  status: ZSourceStatus,
  snapshot: z.record(z.string(), z.any()).optional(),
  isHidden: z.boolean().optional(),

  createdAt: ZIsoDate.optional(),
  updatedAt: ZIsoDate.optional(),
});

export const ZAnalysis = z.object({
  id: ZAnalysisId,
  dataSourceId: ZSourceId.optional(),
  runStatus: ZAnalysisStatus,
  type: z.enum(['SUMMARY', 'INSIGHT_EXTRACTION', 'ANOMALY_DETECTION', 'ESTIMATION']),
  version: z.number(),
  output: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()).optional(),
  createdAt: ZIsoDate.optional(),
  updatedAt: ZIsoDate.optional(),
  processedAt: ZIsoDate.optional(),
});

export type AIAgent = z.infer<typeof ZAIAgent>;
export type FileReference = z.infer<typeof ZFileReference>;
export type DataSource = z.infer<typeof ZDataSource>;
export type Analysis = z.infer<typeof ZAnalysis>;
