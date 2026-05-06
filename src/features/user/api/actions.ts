import { queryOptions, mutationOptions } from '@tanstack/react-query';
import { userApi } from './http';
import { meApi } from './me-http';
import type { UserUpdateInput } from '@/contracts/user/user.input';
import type { ProfileUpdateInput } from '@/contracts/user/profile';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const userKeys = {
  all: ['users'] as const,
  me: () => ['me'] as const,
  meProfile: () => ['me', 'profile'] as const,
  search: (search: string) => [...userKeys.all, 'search', search] as const,
};

// ─── Search (existing) ───────────────────────────────────────────────────────

export const searchUsersQueryOptions = (
  search: string,
  options?: { resourceType: 'WORKSPACE'; resourceId: string },
) => {
  return queryOptions({
    queryKey: userKeys.search(search),
    queryFn: () => userApi.search({ search, ...options }),
    select: (res: any) => res.data,
    enabled: search.length > 0,
  });
};

// ─── Me ──────────────────────────────────────────────────────────────────────

export const getMeQueryOptions = () => {
  return queryOptions({
    queryKey: userKeys.me(),
    queryFn: () => meApi.getMe(),
    staleTime: 1000 * 60 * 5,
  });
};

export const updateMeMutationOptions = () => {
  return mutationOptions({
    mutationFn: (data: UserUpdateInput) => meApi.updateMe(data),
  });
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getMeProfileQueryOptions = () => {
  return queryOptions({
    queryKey: userKeys.meProfile(),
    queryFn: () => meApi.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
};

export const updateMeProfileMutationOptions = () => {
  return mutationOptions({
    mutationFn: (data: ProfileUpdateInput) => meApi.updateProfile(data),
  });
};

// ─── Password ────────────────────────────────────────────────────────────────

export const changePasswordMutationOptions = () => {
  return mutationOptions({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      meApi.changePassword(data),
  });
};
