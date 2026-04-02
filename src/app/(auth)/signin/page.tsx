'use client';

import { SignInForm } from '@/features/authn/ui/forms';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function SignInPageContent() {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('searchParams is null');

  const redirectTo = searchParams.get('from') || '/orgs';

  return <SignInForm redirectTo={redirectTo} />;
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageContent />
    </Suspense>
  );
}
