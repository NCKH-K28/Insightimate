import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useIssueStar(issueId: string, userId?: string) {
  const queryClient = useQueryClient();

  // Lấy trạng thái star + số lượng
  const { data, isLoading } = useQuery({
    queryKey: ["issue-star", issueId],
    queryFn: async () => {
      const res = await axios.get(`/api/v2/issues/${issueId}/star`);
      return res.data; // { isStarred: boolean, starCount: number }
    },
  });

  // Star issue
  const starMutation = useMutation({
    mutationFn: async () => {
      return await axios.post(`/api/v2/issues/${issueId}/star`);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["issue-star", issueId], res.data);
    },
  });

  // Unstar issue
  const unstarMutation = useMutation({
    mutationFn: async () => {
      return await axios.delete(`/api/v2/issues/${issueId}/star`);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["issue-star", issueId], res.data);
    },
  });

  const toggleStar = async () => {
    if (data?.isStarred) {
      await unstarMutation.mutateAsync();
    } else {
      await starMutation.mutateAsync();
    }
  };

  return {
    isStarred: data?.isStarred ?? false,
    starCount: data?.starCount ?? 0,
    isLoading,
    toggleStar,
    isPending: starMutation.isPending || unstarMutation.isPending,
  };
}