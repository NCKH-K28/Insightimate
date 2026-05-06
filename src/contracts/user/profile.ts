import { z } from 'zod';

export const ZOnboardingStep = z.object({
  profileComplete: z.boolean().default(false),
  orgCreateOrJoin: z.boolean().default(false),
});

export const ZProfile = z.object({
  id: z.string(),
  userId: z.string(),
  theme: z.record(z.string(), z.unknown()).default({}),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  startOfWeek: z.number().min(0).max(6).default(0),
  role: z.string().nullish(),
  lastOrgSlug: z.string().nullish(),
  isOnboarded: z.boolean().default(false),
  onboardingStep: ZOnboardingStep.default({}),
});

export const ZProfileUpdateInput = ZProfile.omit({ id: true, userId: true }).partial();

export type Profile = z.infer<typeof ZProfile>;
export type ProfileUpdateInput = z.infer<typeof ZProfileUpdateInput>;
export type OnboardingStep = z.infer<typeof ZOnboardingStep>;

