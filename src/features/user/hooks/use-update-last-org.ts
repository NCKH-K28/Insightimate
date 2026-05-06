'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { meApi } from '@/features/user/api/me-http';
import { getMeProfileQueryOptions } from '@/features/user/api/actions';

/**
 * Silently updates the user's lastOrgSlug when they navigate to a new org.
 * Avoids unnecessary API calls if the slug hasn't changed.
 */
export function useUpdateLastOrg(orgSlug: string) {
  const { data: profile } = useQuery(getMeProfileQueryOptions());
  const prevSlugRef = useRef<string | null>(null);

  const updateProfile = useMutation({
    mutationFn: (data: { lastOrgSlug: string }) => meApi.updateProfile(data),
  });

  useEffect(() => {
    if (!profile || !orgSlug) return;

    // Only update if different from current lastOrgSlug and from our last update
    if (profile.lastOrgSlug !== orgSlug && prevSlugRef.current !== orgSlug) {
      prevSlugRef.current = orgSlug;
      updateProfile.mutate({ lastOrgSlug: orgSlug });
    }
  }, [orgSlug, profile]);
}
