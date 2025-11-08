'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { EstimationReport as EstimationReportType } from '../../_components/reports/estimation-report/types';
import { EstimationReport } from '../../_components/reports/estimation-report';

export default function Page() {
  const params = useParams<{ workspaceId: string; agentId: string; analyzeId: string }>();
  const { data: analyze, isPending } = useQuery({
    queryKey: ['estimation-report', params.analyzeId],
    queryFn: async () => {
      const res = await fetch(`/api/v2/agents/${params.agentId}/analyses/${params.analyzeId}`);
      const { data } = await res.json();
      return data as { type: string; version: number; output: EstimationReportType };
    },
  });

  if (isPending) return <div>Loading...</div>;
  if (!analyze) return <div>No analysis data found.</div>;
  if (!('type' in analyze && 'version' in analyze && 'output' in analyze))
    return <div>Invalid analysis data structure.</div>;

  const type = analyze.type;
  const version = analyze.version;

  if (type == 'ESTIMATION' && version == 1) {
    const estimationReport = analyze.output as EstimationReportType;
    return <EstimationReport data={estimationReport} />;
  }

  return <div>Unsupported analysis type or version.</div>;
}
