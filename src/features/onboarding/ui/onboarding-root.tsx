'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';
import { getMeProfileQueryOptions, userKeys } from '@/features/user/api/actions';
import { meApi } from '@/features/user/api/me-http';
import { listOrgsQueryOptions } from '@/features/organization/api/actions';

import { ProfileSetupStep } from './steps/profile-setup';
import { OrgSetupStep } from './steps/org-setup';

export enum EOnboardingStep {
  PROFILE_SETUP = 'PROFILE_SETUP',
  ORG_SETUP = 'ORG_SETUP',
}

export function OnboardingRoot() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: profile } = useQuery({
    ...getMeProfileQueryOptions(),
    enabled: !!session?.user,
  });

  const { data: orgs } = useQuery({
    ...listOrgsQueryOptions(),
    enabled: !!session?.user,
  });

  // Determine initial step based on profile state
  const getInitialStep = (): EOnboardingStep => {
    const step = profile?.onboardingStep as any;
    if (step?.profileComplete) return EOnboardingStep.ORG_SETUP;
    return EOnboardingStep.PROFILE_SETUP;
  };

  const [currentStep, setCurrentStep] = useState<EOnboardingStep>(getInitialStep);

  const updateProfile = useMutation({
    mutationFn: (data: any) => meApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.meProfile() });
    },
  });

  const finishOnboarding = useCallback(async () => {
    try {
      await updateProfile.mutateAsync({
        isOnboarded: true,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.meProfile() });

      // Redirect to first org or org list
      const orgList = Array.isArray(orgs) ? orgs : [];
      if (orgList.length > 0) {
        router.replace(`/o/${orgList[0].slug}`);
      } else {
        router.replace('/orgs');
      }
    } catch {
      toast.error('Failed to complete onboarding.');
    }
  }, [orgs, updateProfile, queryClient, router]);

  const handleStepChange = useCallback(
    async (step: EOnboardingStep) => {
      switch (step) {
        case EOnboardingStep.PROFILE_SETUP: {
          // Profile setup done → check if user already has orgs
          await updateProfile.mutateAsync({
            onboardingStep: {
              ...(profile?.onboardingStep as any),
              profileComplete: true,
            },
          });

          const orgList = Array.isArray(orgs) ? orgs : [];
          if (orgList.length > 0) {
            // Already has orgs — finish immediately
            await finishOnboarding();
          } else {
            setCurrentStep(EOnboardingStep.ORG_SETUP);
          }
          break;
        }
        case EOnboardingStep.ORG_SETUP: {
          await updateProfile.mutateAsync({
            onboardingStep: {
              ...(profile?.onboardingStep as any),
              orgCreateOrJoin: true,
            },
          });
          // Invalidate orgs so we get the new one
          await queryClient.invalidateQueries({ queryKey: ['orgs'] });
          await finishOnboarding();
          break;
        }
      }
    },
    [profile, orgs, updateProfile, finishOnboarding, queryClient],
  );

  // Step indicator
  const steps = [
    { key: EOnboardingStep.PROFILE_SETUP, label: 'Profile Setup' },
    { key: EOnboardingStep.ORG_SETUP, label: 'Create Organization' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold'>Welcome to Insightimate</h1>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className='mt-4 flex gap-2'>
          {steps.map((step, idx) => (
            <div
              key={step.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                idx <= currentStepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-lg px-6 py-12'>
          {currentStep === EOnboardingStep.PROFILE_SETUP && (
            <ProfileSetupStep
              onComplete={() => handleStepChange(EOnboardingStep.PROFILE_SETUP)}
            />
          )}
          {currentStep === EOnboardingStep.ORG_SETUP && (
            <OrgSetupStep
              onComplete={() => handleStepChange(EOnboardingStep.ORG_SETUP)}
              onSkip={() => finishOnboarding()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
