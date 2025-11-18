export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all] as const,
  detail: (agentId: string) => ['agent', agentId] as const,
  sources: (agentId: string) => ['agent-sources', agentId] as const,
  analyses: (agentId: string) => ['agent-analyses', agentId] as const,
  analysis: (agentId: string, analysisId: string) =>
    ['agent-analysis', agentId, analysisId] as const,
};
