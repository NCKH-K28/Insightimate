import { z } from 'zod';

const isoString = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.iso.datetime({ offset: true }),
);

export const ZUser = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.email(),
  avatar: z.string().nullish(),
  displayName: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  coverImage: z.string().nullish(),
  timezone: z.string().default('UTC'),
  dateJoined: isoString.optional(),
  createdAt: isoString,
  updatedAt: isoString,
});

export const ZUserPublic = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.email().optional(),
  avatar: z.string().nullish(),
  displayName: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
});

export const ZPassword = z.string().min(6, 'Password must be at least 6 characters long');

export type User = z.infer<typeof ZUser>;
export type UserPublic = z.infer<typeof ZUserPublic>;
