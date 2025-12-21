import { useQuery } from '@tanstack/react-query';

export const useInsightSuggestions = (workspaceId: string) => {
  return useQuery({
    queryKey: ['insight-suggestions', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/suggestions?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data = await res.json();
      return data.suggestions as string[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: false,
  });
};
