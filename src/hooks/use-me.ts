import { authClient } from '@/lib/auth-client';

export const useMe = () => {
  const { data: session, isPending, error } = authClient.useSession();

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isPending,
    error,
    isAuthenticated: !!session?.user,
  };
};
