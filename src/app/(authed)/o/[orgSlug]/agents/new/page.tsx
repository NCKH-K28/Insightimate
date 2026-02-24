'use client';

import { CreateAgentForm } from '@/features/agents/ui/forms/create-agent-form';
import { redirect, useParams } from 'next/navigation';

export default function NewAgentPage() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Missing params');
  const { workspaceId } = params;
  return (
    <div className='size-full overflow-auto'>
      <CreateAgentForm
        values={{ workspaceId }}
        onSuccess={(data) => {
          redirect(`/wps/${workspaceId}/agents/${data.id}`);
        }}
      />
    </div>
  );
}
