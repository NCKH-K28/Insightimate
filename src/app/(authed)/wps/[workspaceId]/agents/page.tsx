'use client';

import { useParams } from 'next/navigation';
import { AgentsList } from '@/features/agents/ui/components/agents-list';

export default function Page() {
  const params = useParams<{ workspaceId: string }>();

  return (
    <div className='size-full'>
      <div className='p-6 border-b'>
        <h1 className='text-2xl font-bold'>Agents</h1>
        <p className='text-gray-600'>Manage your AI agents here.</p>
      </div>
      <AgentsList params={params} />
    </div>
  );
}
