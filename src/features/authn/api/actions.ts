import { isAuthed } from '@/lib/utils/api';
import { queryOptions } from '@tanstack/react-query';
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
  return {
    mutationKey: ['signout'],
    mutationFn: async () => authApi.signOut({}, {}),
    meta: { clear: true },
  };
};

export const signInMutationOptions = () => {
  return {
    mutationKey: ['signin'],
    mutationFn: (data: Parameters<typeof authApi.signIn>[0]) => authApi.signIn({}, data),
    meta: { invalidateQueries: [['me']] },
  };
};

export const signUpMutationOptions = () => {
  return {
    mutationKey: ['signup'],
    mutationFn: (data: Parameters<typeof authApi.signUp>[0]) => authApi.signUp({}, data),
    meta: { invalidateQueries: [['me']] },
  };
};
