'use client';

import { EditAgentForm } from '@/features/agents/ui/forms/edit-agent-form';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ workspaceId: string; agentId: string }>();
  if (!params) throw new Error('Missing params');

  return (
    <div className='size-full overflow-auto'>
      <EditAgentForm params={params} />
    </div>
  );
}
