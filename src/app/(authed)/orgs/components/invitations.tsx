'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import type { OrgInvitationItem } from '@/contracts/organization/organization.query';
import { OrgAvatar, RoleBadge, formatRelative } from './org-shared';
import { listOrgsInviteesQueryOptions } from '@/features/organization/api/actions';

type InvitationRowProps = {
  invite: OrgInvitationItem;
  isProcessing?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};

export const InvitationRow: React.FC<InvitationRowProps> = ({
  invite,
  onAccept,
  onReject,
  isProcessing,
}) => {
  const org = invite.organization;
  const role = invite.role;

  if (!org) throw new Error('Organization data is missing in the invitation.');
  return (
    <Card>
      <CardContent className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-center gap-4 w-full md:w-auto'>
          <OrgAvatar name={org.name} logo={org.logo} />

          <div className='min-w-0 flex-1'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2'>
              <h3
                className={cn(
                  'min-w-0 font-semibold text-slate-800 text-base sm:text-lg leading-snug line-clamp-2 sm:line-clamp-1',
                  'group-hover:text-primary',
                )}
              >
                {org.name}
              </h3>
              <RoleBadge role={role} />
            </div>

            {org.createdAt && (
              <p className='text-xs text-slate-500'>{formatRelative(org.createdAt, 'Invited')}</p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
          <Button onClick={onAccept} disabled={isProcessing}>
            {isProcessing && <Loader2 className='animate-spin' />}
            {isProcessing ? 'Joining...' : 'Accept'}
          </Button>
          <Button onClick={onReject} disabled={isProcessing} variant='outline'>
            {isProcessing && <Loader2 className='animate-spin' />}
            {isProcessing ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const InvitationsSection: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);

  const fetchInvites = useQuery(listOrgsInviteesQueryOptions());

  const inviteMutation = useMutation({
    mutationFn: async (i: { inviteId: string; action: 'accept' | 'reject' }) => {
      // TODO: gọi API accept/reject ở đây
      console.log(i);
    },
  });

  if (fetchInvites.isPending || fetchInvites.isError) return null;
  if (fetchInvites.data.length === 0) return null;

  const open = !collapsed;

  return (
    <section className='animate-fade-in'>
      <Collapsible open={open} onOpenChange={(nextOpen) => setCollapsed(!nextOpen)}>
        <div className='flex items-center justify-between mb-4 border-b border-slate-200 pb-2'>
          <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2'>
            Pending invitations
            <span className='bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full'>
              {fetchInvites.data.length}
            </span>
          </h2>

          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='icon' aria-label='Toggle invitations'>
              {open ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className='grid gap-3 max-h-lg overflow-y-auto'>
          {fetchInvites.data.map((invite) => (
            <InvitationRow
              key={invite.id}
              invite={invite}
              isProcessing={inviteMutation.isPending}
              onAccept={() => inviteMutation.mutate({ inviteId: invite.id, action: 'accept' })}
              onReject={() => inviteMutation.mutate({ inviteId: invite.id, action: 'reject' })}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
};
