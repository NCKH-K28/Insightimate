'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { getMeProfileQueryOptions } from '@/features/user/api/actions';
import { listOrgsQueryOptions } from '@/features/organization/api/actions';

type AuthGuardProps = {
  children: ReactNode;
};

/**
 * Client-side AuthGuard — mirrors Plane's AuthenticationWrapper logic.
 *
 * Rules:
 * 1. If no session → redirect to /signin (already handled by middleware, this is a fallback)
 * 2. If session but NOT onboarded → redirect to /onboarding
 * 3. If session, onboarded, and at root "/" → redirect to lastOrgSlug or first org
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const {
    data: profile,
    isLoading: isProfileLoading,
  } = useQuery({
    ...getMeProfileQueryOptions(),
    enabled: !!session?.user,
  });

  const {
    data: orgsResponse,
    isLoading: isOrgsLoading,
  } = useQuery({
    ...listOrgsQueryOptions(),
    enabled: !!session?.user && !!profile,
  });

  const [isRedirecting, setIsRedirecting] = useState(false);

  const isLoading = isSessionLoading || isProfileLoading || isOrgsLoading;

  useEffect(() => {
    if (isLoading || isRedirecting) return;

    // No session — redirect to signin (fallback; middleware handles this primarily)
    if (!session?.user) {
      setTimeout(() => setIsRedirecting(true), 0);
      router.replace(`/signin?from=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }

    // Not onboarded — force onboarding (unless already there)
    if (profile && !profile.isOnboarded && pathname !== '/onboarding') {
      setTimeout(() => setIsRedirecting(true), 0);
      router.replace('/onboarding');
      return;
    }

    // Already onboarded but on /onboarding — redirect away
    if (profile?.isOnboarded && pathname === '/onboarding') {
      setTimeout(() => setIsRedirecting(true), 0);
      const orgs = Array.isArray(orgsResponse) ? orgsResponse : [];
      let target = '/orgs';
      if (profile?.lastOrgSlug && orgs.some((o: any) => o.slug === profile.lastOrgSlug)) {
        target = `/o/${profile.lastOrgSlug}`;
      } else if (orgs.length > 0) {
        target = `/o/${orgs[0].slug}`;
      }
      router.replace(target);
      return;
    }
  }, [isLoading, session, profile, orgsResponse, pathname, isRedirecting, router]);

  // Show loading spinner while determining auth state
  if (isLoading || isRedirecting) {
    return (
      <div className='flex h-screen w-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return <>{children}</>;
}
