import { z } from 'zod';
import { ZPassword, ZUser } from './user';

export const ZUserCreateInput = z.object({
  name: ZUser.shape.name,
  email: ZUser.shape.email,
  avatar: ZUser.shape.avatar,
});

export const ZUserUpdateInput = z.object({
  name: ZUser.shape.name.optional(),
  displayName: z.string().max(50).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  avatar: ZUser.shape.avatar.optional(),
  coverImage: z.string().nullish(),
  timezone: z.string().optional(),
});

export const ZChangePasswordInput = z.object({ oldPassword: ZPassword, newPassword: ZPassword });

export type UserCreateInput = z.infer<typeof ZUserCreateInput>;
export type UserUpdateInput = z.infer<typeof ZUserUpdateInput>;
export type ChangePasswordInput = z.infer<typeof ZChangePasswordInput>;
