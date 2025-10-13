import { isAuthed } from '@/lib/utils/api';
import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { authApi } from './http';

export const getMeQueryOptions = () => {
  const authed = isAuthed();
  return queryOptions({
    queryKey: ['me'],
    queryFn: async () => authApi.getMe({}, {}),
    staleTime: 1000 * 60 * 5,
    enabled: authed,
  });
};

export const signoutMutationOptions = () => {
  const queryClient = useQueryClient();
  return {
    mutationKey: ['signout'],
    mutationFn: async () => authApi.signOut({}, {}),
    onSuccess: () => queryClient.clear(),
  };
};

export const signInMutationOptions = () => {
  const queryClient = useQueryClient();
  return {
    mutationKey: ['signin'],
    mutationFn: (data: Parameters<typeof authApi.signIn>[0]) => authApi.signIn({}, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  };
};

export const signUpMutationOptions = () => {
  const queryClient = useQueryClient();
  return {
    mutationKey: ['signup'],
    mutationFn: (data: Parameters<typeof authApi.signUp>[0]) => authApi.signUp({}, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  };
};
