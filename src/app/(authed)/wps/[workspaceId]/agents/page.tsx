'use client';

import { useParams } from 'next/navigation';
import { AgentsList } from '@/features/agents/ui/components/agents-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Page() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Missing params');

  return (
    <div className='size-full'>
      <div className='p-6 border-b'>
        <h1 className='text-2xl font-bold'>Agents</h1>
        <p className='text-gray-600'>Manage your AI agents here.</p>
      </div>
      <div className='flex items-center justify-between'>
        <Input placeholder='Search agents...' className='m-6 w-[300px]' />
        <Link href={`/wps/${params.workspaceId}/agents/new`}>
          <Button variant='link' size='sm'>
            New Agent
          </Button>
        </Link>
      </div>
      <AgentsList params={params} />
    </div>
  );
}
