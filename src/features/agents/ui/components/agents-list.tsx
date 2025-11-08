'use client';

import { useQuery } from '@tanstack/react-query';

type AgentsListProps = { params: { workspaceId: string } };
export const AgentsList = (props: AgentsListProps) => {
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/v2/agents');
      const data = await response.json();
      return data.data;
    },
  });

  return (
    <div className='p-4 space-y-4'>
      {agents?.map((agent: any) => (
        <div key={agent.id} className='p-4 border rounded'>
          <h2 className='text-xl font-bold'>
            <a href={`agents/${agent.id}`} className='text-blue-600 hover:underline'>
              {agent.name}
            </a>
          </h2>
          <p className='text-gray-600'>{agent.description}</p>
        </div>
      ))}
    </div>
  );
};
