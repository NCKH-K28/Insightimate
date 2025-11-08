'use client';

import { CreateAgentForm } from '@/features/agents/ui/components/create-agent-form';
import { redirect, useParams } from 'next/navigation';

export default function NewAgentPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return (
    <div>
      <div className='text-2xl font-semibold p-6 border-b'>Create New Agent</div>
      <CreateAgentForm
        values={{ workspaceId }}
        onSuccess={(data) => {
          redirect(`/wps/${workspaceId}/agents/${data.id}`);
        }}
      />
    </div>
  );
}
