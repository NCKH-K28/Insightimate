'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  assignOrgMemberRoleMutationOptions,
  getOrgQueryOptions,
  inviteOrgMembersMutationOptions,
  listOrgInvitationsQueryOptions,
  listOrgMembersQueryOptions,
  removeOrgMemberMutationOptions,
  resendOrgInvitationMutationOptions,
  revokeOrgInvitationMutationOptions,
  leaveOrgMutationOptions,
} from '@/features/organization/api/actions';
import { OrgMemberItem, OrgInvitationItem } from '@/contracts/organization/organization.query';
import { useParamsRequired } from '@/hooks/next-navigation';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { OrgMembersList, OrgMembersListSkeleton } from '../../_components/org-members-list';
import { OrgInviteesList, OrgInviteesListSkeleton } from '../../_components/org-invitees-list';
import { AddOrgMemberDialog } from '../../_components/add-org-member-dialog';
import { ConfirmDialog } from '../../_components/confirm-dialog';
import { ErrorBoundary, ErrorState } from '../../_components/error-boundary';
import { MembersEmptyState, InvitationsEmptyState } from '../../_components/empty-states';
import { toast } from 'sonner';
import { getErrorMsg } from '@/lib/api/helper';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type Member = OrgMemberItem;
type Invitation = OrgInvitationItem;

function MembersPageContent() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();
  const { data: org } = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Confirmation dialog states
  const [removeMemberDialog, setRemoveMemberDialog] = React.useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null });

  const [revokeInviteDialog, setRevokeInviteDialog] = React.useState<{
    open: boolean;
    invitation: Invitation | null;
  }>({ open: false, invitation: null });

  const [leaveOrgDialog, setLeaveOrgDialog] = React.useState(false);

  const fetchOrgMems = useQuery(listOrgMembersQueryOptions(org.id));
  const fetchInvites = useQuery(listOrgInvitationsQueryOptions(org.id));

  const invalidateData = () => {
    queryClient.invalidateQueries({
      queryKey: ['orgs', 'detail', { params: { id: org.id } }, 'members'],
    });
    queryClient.invalidateQueries({
      queryKey: ['orgs', 'detail', { params: { id: org.id } }, 'invitations'],
    });
  };

  const inviteMems = useMutation({
    ...inviteOrgMembersMutationOptions(org.id),
    onSuccess: () => {
      toast.success('Invitations sent');
      invalidateData();
      setIsAddDialogOpen(false);
    },
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to invite members')),
  });

  const removeMember = useMutation({
    ...removeOrgMemberMutationOptions(org.id),
    onSuccess: () => {
      toast.success('Member removed');
      invalidateData();
      setRemoveMemberDialog({ open: false, member: null });
    },
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to remove member')),
  });

  const assignRole = useMutation({
    ...assignOrgMemberRoleMutationOptions(org.id),
    onSuccess: () => {
      toast.success('Role updated');
      invalidateData();
    },
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to update role')),
  });

  const resendInvite = useMutation({
    ...resendOrgInvitationMutationOptions(org.id),
    onSuccess: () => toast.success('Invitation resent'),
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to resend invitation')),
  });

  const revokeInvite = useMutation({
    ...revokeOrgInvitationMutationOptions(org.id),
    onSuccess: () => {
      toast.success('Invitation revoked');
      invalidateData();
      setRevokeInviteDialog({ open: false, invitation: null });
    },
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to revoke invitation')),
  });

  const leaveOrg = useMutation({
    ...leaveOrgMutationOptions(org.id),
    onSuccess: () => {
      toast.success('You have left the organization');
      router.push('/o'); // Redirect to org listing
    },
    onError: (err) => toast.error(getErrorMsg(err, 'Failed to leave organization')),
  });

  const roleOptions = React.useMemo(() => {
    const perm = org._me?.perms;
    const options: Member['role'][] = [];

    // Server returns permissions based on Cerbos policies
    // Owner will have both permissions via policies
    if (perm?.includes('members:manage#admin')) options.push('ORG_ADMIN');
    if (perm?.includes('members:manage#member')) options.push('ORG_MEMBER');

    return options;
  }, [org._me?.perms]);

  const canManageRole = (role: Member['role']) => {
    if (role === 'ORG_OWNER') return false;
    return roleOptions.includes(role);
  };

  const canRemoveMember = (member: Member) => {
    if (member._me?.isMe) return false; // Is me -> use Leave
    if (!canManageRole(member.role)) return false;
    return true;
  };

  const handleRemoveMember = () => {
    if (removeMemberDialog.member) {
      removeMember.mutate(removeMemberDialog.member.userId);
    }
  };

  const handleRevokeInvite = () => {
    if (revokeInviteDialog.invitation) {
      revokeInvite.mutate(revokeInviteDialog.invitation.email);
    }
  };

  const handleLeaveOrg = () => {
    leaveOrg.mutate();
    setLeaveOrgDialog(false);
  };

  const canInviteMembers = roleOptions.length > 0;

  return (
    <div className='size-full flex flex-col gap-4'>
      <AddOrgMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        roleOptions={roleOptions}
        onSend={inviteMems.mutateAsync}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) => setRemoveMemberDialog({ open, member: null })}
        title='Remove Member'
        description={`Are you sure you want to remove ${removeMemberDialog.member?.user?.name || 'this member'} from the organization? They will lose access immediately.`}
        confirmText='Remove'
        variant='destructive'
        onConfirm={handleRemoveMember}
        loading={removeMember.isPending}
      />

      {/* Revoke Invitation Confirmation */}
      <ConfirmDialog
        open={revokeInviteDialog.open}
        onOpenChange={(open) => setRevokeInviteDialog({ open, invitation: null })}
        title='Revoke Invitation'
        description={`Are you sure you want to revoke the invitation for ${revokeInviteDialog.invitation?.email}? They will not be able to join using this invitation.`}
        confirmText='Revoke'
        variant='destructive'
        onConfirm={handleRevokeInvite}
        loading={revokeInvite.isPending}
      />

      {/* Leave Organization Confirmation */}
      <ConfirmDialog
        open={leaveOrgDialog}
        onOpenChange={setLeaveOrgDialog}
        title='Leave Organization'
        description={`Are you sure you want to leave ${org.name}? You will lose access to all projects and data in this organization.`}
        confirmText='Leave'
        variant='destructive'
        onConfirm={handleLeaveOrg}
        loading={leaveOrg.isPending}
      />

      <div className='h-12 px-4 flex items-center border-b justify-between'>
        <h1 className='text-sm text-muted-foreground'>Members Settings</h1>
        <Button
          variant='ghost'
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
          onClick={() => setLeaveOrgDialog(true)}
        >
          Leave Organization
        </Button>
      </div>

      <div className='px-4 pb-12 space-y-8'>
        {/* Members Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-semibold'>Members</h2>
              <Badge variant='outline'>{fetchOrgMems.data?.length || 0}</Badge>
            </div>
            <div className='flex gap-2 justify-end'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        disabled={!canInviteMembers || inviteMems.isPending}
                      >
                        Add Member
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canInviteMembers && (
                    <TooltipContent>
                      <p>You don&apos;t have permission to invite members</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {fetchOrgMems.error ? (
            <ErrorState
              error={fetchOrgMems.error}
              onRetry={() => fetchOrgMems.refetch()}
              title='Failed to load members'
            />
          ) : fetchOrgMems.isPending ? (
            <OrgMembersListSkeleton />
          ) : fetchOrgMems.data && fetchOrgMems.data.length === 0 ? (
            <MembersEmptyState onAddMember={() => setIsAddDialogOpen(true)} />
          ) : (
            <OrgMembersList
              members={fetchOrgMems.data || []}
              roleOptions={roleOptions}
              onRemoveMember={(m) => setRemoveMemberDialog({ open: true, member: m })}
              canRemove={canRemoveMember}
              onAssignRole={(m, r) => assignRole.mutate({ userId: m.userId, role: r })}
              canAssignRole={(m) => !m._me?.isMe && canManageRole(m.role)}
              isAssigningRole={assignRole.isPending}
            />
          )}
        </div>

        {/* Invites Section */}
        {canInviteMembers && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-semibold'>Pending Invitations</h2>
              <Badge variant='outline'>{fetchInvites.data?.length || 0}</Badge>
            </div>

            {fetchInvites.error ? (
              <ErrorState
                error={fetchInvites.error}
                onRetry={() => fetchInvites.refetch()}
                title='Failed to load invitations'
              />
            ) : fetchInvites.isPending ? (
              <OrgInviteesListSkeleton />
            ) : fetchInvites.data && fetchInvites.data.length === 0 ? (
              <InvitationsEmptyState />
            ) : (
              <OrgInviteesList
                invitees={fetchInvites.data || []}
                roleOptions={roleOptions}
                onResend={(i) => resendInvite.mutate(i.email)}
                onRevoke={(i) => setRevokeInviteDialog({ open: true, invitation: i })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <MembersPageContent />
    </ErrorBoundary>
  );
}
