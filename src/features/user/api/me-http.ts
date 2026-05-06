import { baseApi } from '@/lib/api';
import type { User } from '@/contracts/user/user';
import type { UserUpdateInput, ChangePasswordInput } from '@/contracts/user/user.input';
import type { Profile, ProfileUpdateInput } from '@/contracts/user/profile';

export const meApi = {
  /** GET /api/v3/me */
  getMe: () => baseApi.get<User>('v3/me'),

  /** PATCH /api/v3/me */
  updateMe: (data: UserUpdateInput) => baseApi.patch<User>('v3/me', data),

  /** GET /api/v3/me/profile */
  getProfile: () => baseApi.get<Profile>('v3/me/profile'),

  /** PATCH /api/v3/me/profile */
  updateProfile: (data: ProfileUpdateInput) => baseApi.patch<Profile>('v3/me/profile', data),

  /** PUT /api/v3/me/password */
  changePassword: (data: ChangePasswordInput) =>
    baseApi.put<{ ok: boolean }>('v3/me/password', data),
};
