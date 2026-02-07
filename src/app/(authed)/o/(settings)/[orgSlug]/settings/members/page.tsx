'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrgQueryOptions,
  inviteOrgMembersMutationOptions,
  listOrgMembersQueryOptions,
} from '@/features/organization/api/actions';
import { OrgMemberItem } from '@/contracts/organizations/organization.query';
import { useParamsRequired } from '@/hooks/next-navigation';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { OrgMembersList, OrgMembersListSkeleton } from '../../_components/org-members-list';
import { OrgInviteesList } from '../../_components/org-invitees-list';
import { AddOrgMemberDialog } from '../../_components/add-org-member-dialog';
import { toast } from 'sonner';
import { getErrorMsg } from '@/lib/api/helper';

type Member = OrgMemberItem;

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();
  const { data: org } = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const fetchOrgMems = useQuery(listOrgMembersQueryOptions(org.id));
  const inviteMems = useMutation({
    ...inviteOrgMembersMutationOptions(org.id),
    onError: (err) => {
      const msg = getErrorMsg(err, 'Failed to invite members');
      toast.error(msg);
    },
  });

  const roleOptions = React.useMemo(() => {
    const perm = org._me?.perms;
    const options: Member['role'][] = [];
    if (perm?.includes('members:manage#admin')) options.push('ORG_ADMIN');
    if (perm?.includes('members:manage#member')) options.push('ORG_MEMBER');
    return options;
  }, [org._me?.perms]);

  return (
    <div className='size-full flex flex-col gap-4'>
      <AddOrgMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        roleOptions={roleOptions}
        onSend={inviteMems.mutateAsync}
      />

      <div className='h-12 px-4 flex items-center border-b'>
        <h1 className='text-sm text-muted-foreground'>Members Settings</h1>
      </div>
      <div className='px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold'>Members</h2>
            <Badge>{0} Members</Badge>
          </div>
          <div className='flex gap-2 justify-end'>
            <Button onClick={() => setIsAddDialogOpen(true)} hidden={roleOptions.length === 0}>
              Add Member
            </Button>
          </div>
        </div>
        <div className='pt-4'>
          {fetchOrgMems.isPending ? (
            <OrgMembersListSkeleton />
          ) : (
            <OrgMembersList members={fetchOrgMems.data || []} roleOptions={roleOptions} />
          )}
          <OrgInviteesList invitees={[{ email: 'user1@example.com', role: 'ORG_MEMBER' }]} />
        </div>
      </div>
    </div>
  );
}
