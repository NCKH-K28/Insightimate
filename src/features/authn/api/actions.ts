import { queryOptions } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

const isAuthed = () => true; // FIXME: imple use me

type Me = { id: string; email: string; name: string; avatar?: string; image?: string };
export const getMeQueryOptions = () => {
  const authed = isAuthed();
  return queryOptions({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authClient.getSession();
      if (res.error || !res.data) throw res.error ?? new Error('Not authenticated');
      return res.data.user;
    },
    staleTime: 1000 * 60 * 5,
    enabled: authed,
  });
};

export const signoutMutationOptions = () => {
  return {
    mutationKey: ['signout'],
    mutationFn: async () => {
      const res = await authClient.signOut();
      if (res.error) throw res.error;
      return res.data;
    },
    meta: { clear: true },
  };
};

export const signInMutationOptions = () => {
  return {
    mutationKey: ['signin'],
    mutationFn: async (data: Parameters<typeof authClient.signIn.email>[0]) => {
      const res = await authClient.signIn.email(data);
      if (res.error) throw res.error;
      return res.data;
    },
    meta: { invalidateQueries: [['me']] },
  };
};

export const signUpMutationOptions = () => {
  return {
    mutationKey: ['signup'],
    mutationFn: async (data: Parameters<typeof authClient.signUp.email>[0]) => {
      const res = await authClient.signUp.email(data);
      if (res.error) throw res.error;
      return res.data;
    },
    meta: { invalidateQueries: [['me']] },
  };
};
