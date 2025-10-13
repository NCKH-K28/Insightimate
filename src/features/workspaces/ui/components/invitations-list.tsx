'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { inviteMutationOptions, listInvitesQueryOptions } from '@/features/authz/api/actions';
import { format } from 'date-fns';
import { InvitationActions } from './invitation-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserInvite } from '@/features/users/ui/user-invite';
import { useMemo } from 'react';
import { WorkspaceRole } from '@/contracts/workspaces';
import { formatWsRole, hasWorkspacePermission } from '../../utils';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const InvitationsList = (props: {
  workspaceId: string;
  permissions: Record<string, boolean> | undefined;
}) => {
  const { workspaceId } = props;
  const { data: invitations } = useSuspenseQuery(
    listInvitesQueryOptions({ resourceType: 'WORKSPACE', resourceId: workspaceId }),
  );

  const inviteMember = useMutation(
    inviteMutationOptions({ resourceType: 'WORKSPACE', resourceId: workspaceId }),
  );

  const handleInvite = async (data: { users: { email?: string }[]; role?: WorkspaceRole }) => {
    if (!data.role) return;
    if (inviteMember.isPending) return;
    const invitees = data.users.map((u) => u.email).filter((email) => email !== undefined);
    if (invitees.length === 0) return;
    await toast.promise(inviteMember.mutateAsync({ invitees, role: data.role }), {
      loading: 'Inviting...',
      success: 'Invited successfully!',
      error: 'Failed to invite.',
    });
  };

  const assignableRoles = useMemo(() => {
    if (!props.permissions) return [];
    const roles: WorkspaceRole[] = [];
    if (hasWorkspacePermission('members:manage#admin', props.permissions)) roles.push('WS_ADMIN');
    if (hasWorkspacePermission('members:manage#member', props.permissions)) roles.push('WS_MEMBER');
    return roles;
  }, [props.permissions]);

  const canInvite = useMemo(() => {
    return assignableRoles.length > 0;
  }, [assignableRoles]);

  const avatarFallback = (inv: (typeof invitations)[number]) => {
    if (inv.user.name) return inv.user.name.charAt(0).toUpperCase();
    if (inv.user.email) return inv.user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const expiresAtFormat = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    if (date > now) return format(date, 'PPP');
    return 'Expired';
  };

  return (
    <div className='flex flex-col gap-4 max-h-72 overflow-y-auto mb-4'>
      <div className='flex items-center gap-2'>
        <Label htmlFor='link' className='sr-only'>
          Link
        </Label>
        <Input id='link' value='http://example.com/link/to/document' className='h-8' readOnly />

        <Button size='sm' variant='outline'>
          Copy Link
        </Button>

        <UserInvite
          disabled={!canInvite}
          params={{ resourceType: 'WORKSPACE', resourceId: workspaceId }}
          roleOptions={assignableRoles.map(formatWsRole)}
          onInviteClick={({ users, role }) => {
            if (role !== 'WS_ADMIN' && role !== 'WS_MEMBER') return;
            handleInvite({ users, role });
          }}
        />
      </div>
      <div className='text-sm font-medium'>
        Pending Invitations
        <span className='ml-2 text-gray-500'>({invitations.length})</span>
      </div>
      {invitations.map((inv) => (
        <div key={inv.id} className='flex items-center gap-4'>
          <Avatar>
            <AvatarFallback>{avatarFallback(inv)}</AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium leading-none'>{inv.user.name}</p>
            <p className='text-sm text-muted-foreground truncate'>{inv.user.email || 'No email'}</p>
            <div className='text-sm text-muted-foreground'>
              Expires: {expiresAtFormat(inv.expiresAt)}
            </div>
          </div>
          <Badge className='mt-1'>{inv.status}</Badge>
          <div className='flex items-center gap-4'>
            <Select value={inv.roleId}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue placeholder='Select a role'>{inv.roleId}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {['WS_ADMIN', 'WS_MEMBER'].map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InvitationActions params={{ workspaceId, invitationId: inv.id }} invitation={inv} />
          </div>
        </div>
      ))}
    </div>
  );
};
