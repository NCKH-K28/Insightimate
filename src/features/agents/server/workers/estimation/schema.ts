import { z } from 'zod';

export const AnalysisMsg = z.object({
  analysisId: z.string().min(1),
  dataSourceId: z.string().min(1),
  agentId: z.string().min(1),
});

export type AnalysisMsg = z.infer<typeof AnalysisMsg>;
