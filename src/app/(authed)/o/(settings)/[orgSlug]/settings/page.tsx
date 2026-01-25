'use client';

import { useParamsRequired } from '@/hooks/next-navigation';
import { OrgInfo } from './_components';
import { useOrg } from '@/hooks/org';

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();

  const fetchOrg = useOrg({ id: orgSlug, by: 'slug' });

  if (fetchOrg.isPending) return <div>Loading...</div>;
  if (fetchOrg.isError) return <div>Error loading organization.</div>;
  const org = fetchOrg.data;
  return (
    <div className='size-full flex flex-col gap-4'>
      <div className='h-12 px-4 flex items-center border-b'>
        <h1 className='text-sm text-muted-foreground'>General Settings</h1>
      </div>
      <div className='px-4'>
        <OrgInfo
          org={org}
          onDelete={() => {
            window.location.href = '/orgs';
          }}
        />
      </div>
    </div>
  );
}
