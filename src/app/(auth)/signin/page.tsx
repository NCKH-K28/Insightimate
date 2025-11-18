'use client';

import { SignInForm } from '@/features/authn/ui/forms';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('searchParams is null');

  const redirectTo = searchParams.get('from') || '/wps';

  return <SignInForm redirectTo={redirectTo} />;
}
