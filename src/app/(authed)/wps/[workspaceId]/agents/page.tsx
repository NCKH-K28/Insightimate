'use client';

import { useParams } from 'next/navigation';
import { AgentsList } from '@/features/agents/ui/components/agents-list';

export default function Page() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Missing params');

  return <AgentsList params={params} />;
}
