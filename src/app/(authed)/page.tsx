'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { getMeProfileQueryOptions } from '@/features/user/api/actions';
import { listOrgsQueryOptions } from '@/features/organization/api/actions';

/**
 * Root authenticated page — smart redirect based on user state.
 * The AuthGuard handles onboarding. This page handles the final
 * "where should an onboarded user land?" logic.
 */
export default function Page() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    ...getMeProfileQueryOptions(),
    enabled: !!session?.user,
  });

  const { data: orgs, isLoading: isOrgsLoading } = useQuery({
    ...listOrgsQueryOptions(),
    enabled: !!session?.user && !!profile,
  });

  useEffect(() => {
    if (isProfileLoading || isOrgsLoading || !profile) return;

    const orgList = Array.isArray(orgs) ? orgs : [];

    // Try last visited org
    if (profile.lastOrgSlug) {
      const isValid = orgList.some((o: any) => o.slug === profile.lastOrgSlug);
      if (isValid) {
        router.replace(`/o/${profile.lastOrgSlug}`);
        return;
      }
    }

    // Fallback to first org
    if (orgList.length > 0) {
      router.replace(`/o/${orgList[0].slug}`);
      return;
    }

    // No orgs — go to org list
    router.replace('/orgs');
  }, [profile, orgs, isProfileLoading, isOrgsLoading, router]);

  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
    </div>
  );
}
