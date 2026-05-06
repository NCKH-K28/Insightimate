'use client';

import { useUpdateLastOrg } from '@/features/user/hooks/use-update-last-org';

export function TrackLastOrg({ orgSlug }: { orgSlug: string }) {
  useUpdateLastOrg(orgSlug);
  return null;
}
