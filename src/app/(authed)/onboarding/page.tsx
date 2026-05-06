'use client';

import { OnboardingRoot } from '@/features/onboarding/ui/onboarding-root';

export default function OnboardingPage() {
  return (
    <div className='flex h-screen w-screen items-center justify-center bg-background'>
      <div className='w-full max-w-xl rounded-lg border bg-card shadow-lg'>
        <OnboardingRoot />
      </div>
    </div>
  );
}
