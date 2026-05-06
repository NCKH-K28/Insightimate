import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { UserUpdateInput, ChangePasswordInput } from '@/contracts/user/user.input';
import type { ProfileUpdateInput } from '@/contracts/user/profile';

export type UserServiceContext = { actorId: string };

/**
 * Get the current user by ID.
 */
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return user;
};

/**
 * Update the current user's identity fields.
 */
const updateMe = async (userId: string, data: UserUpdateInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return user;
};

/**
 * Get the user's profile, creating one if it doesn't exist (lazy-create).
 */
const getOrCreateProfile = async (userId: string) => {
  let profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId },
    });
  }

  return profile;
};

/**
 * Get the user's profile.
 */
const getProfile = async (userId: string) => {
  return getOrCreateProfile(userId);
};

/**
 * Update the user's profile preferences.
 */
const updateProfile = async (userId: string, data: ProfileUpdateInput) => {
  // Ensure profile exists first
  await getOrCreateProfile(userId);

  const profile = await prisma.profile.update({
    where: { userId },
    data: data as any,
  });
  return profile;
};

/**
 * Change the user's password using better-auth's built-in API.
 */
const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
  headers: Headers,
) => {
  const result = await auth.api.changePassword({
    body: {
      currentPassword: data.oldPassword,
      newPassword: data.newPassword,
    },
    headers,
  });
  return result;
};

export const userService = {
  getMe,
  updateMe,
  getProfile,
  updateProfile,
  changePassword,
  getOrCreateProfile,
};
