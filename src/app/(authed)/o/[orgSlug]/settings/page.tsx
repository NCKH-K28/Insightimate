'use client';

import { OrgItem } from '@/contracts/organizations/organization.query';
import { getOrgQueryOptions } from '@/features/organization/api/actions';
import { useParamsRequired } from '@/hooks/next-navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { OrgHeader, OrgInfo } from './_components';

const OrgInvitationsList: React.FC<{ org: OrgItem }> = () => {
  // check permissions inside the component as needed
  return <div>Organization Invitations List</div>;
};

const OrgMembersList: React.FC<{ org: OrgItem }> = () => {
  // check permissions inside the component as needed
  return <div>Organization Members List</div>;
};

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();

  const fetchOrg = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));

  if (fetchOrg.isPending) return <div>Loading...</div>;
  if (fetchOrg.isError) return <div>Error loading organization.</div>;
  const org = fetchOrg.data;
  return (
    <div className='container max-w-2xl mx-auto flex flex-col gap-4' id='org-settings-page'>
      <OrgInfo org={org} />
      <OrgInvitationsList org={org} />
      <OrgMembersList org={org} />
    </div>
  );
}
