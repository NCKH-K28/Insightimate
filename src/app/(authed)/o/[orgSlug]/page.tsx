'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { useParamsRequired } from '@/hooks/next-navigation';
import { getOrgQueryOptions } from '@/features/organization/api/actions';
import { ActivityFeedPanel } from '@/features/activity/ui/activity-feed-panel';

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();
  const { data: org } = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>Recent activity across your organization</p>
      </div>

      <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
        <ActivityFeedPanel orgId={org.id} />
      </div>
    </div>
  );
}
