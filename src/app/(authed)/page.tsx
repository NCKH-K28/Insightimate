'use client';

/**
 * Root authenticated page.
 * The AuthGuard in the (authed) layout already handles smart redirect
 * (onboarding check → lastOrgSlug → first org → /orgs).
 * This page only needs to show a loading state while AuthGuard redirects.
 */

import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
    </div>
  );
}
