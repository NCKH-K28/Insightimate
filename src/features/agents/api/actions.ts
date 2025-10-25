import { mutationOptions, useQueryClient } from '@tanstack/react-query';

type AddSourceInput = {
  sourceType: 'PROJECT';
  sourceId: string;
};

type AddSourceOutput = { data: AddSourceInput & { id: string } };

export const addSourceMutationOptions = (params?: { agentId: string }) => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: async (input: AddSourceInput): Promise<AddSourceOutput> => {
      // log
      console.log('Adding source:', input);
      const response = await fetch(`/api/v2/ai/agents/${params?.agentId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to add source to agent');
      return response.json();
    },
    onSuccess: (data: AddSourceOutput) => {
      queryClient.invalidateQueries({ queryKey: ['agent-sources', { agentId: params?.agentId }] });
    },
    onError: (error: Error) => {
      console.error('Error adding source to agent:', error);
    },
  });
};
