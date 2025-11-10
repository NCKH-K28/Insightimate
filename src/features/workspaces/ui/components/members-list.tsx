/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import get from 'lodash/get';
import { useMemo } from 'react';
import {
  assignWorkspaceMemberRoleMutationOptions,
  fetchWorkspaceMembersQueryOptions,
} from '@/features/workspaces/api/actions';
import { toast } from 'sonner';
import { WorkspaceRole } from '@/contracts/workspaces';
import { getMeQueryOptions } from '@/features/authn/api/actions';
import { MemberActions } from './member-actionts';
import { formatWsRole, hasWorkspacePermission, hasWsMemberPermission } from '../../utils';

type UserPublic = {
  id: string;
  name?: string;
  email?: string | undefined;
  avatar?: string | null | undefined;
};

type Member = {
  id: string;
  role: 'WS_ADMIN' | 'WS_MEMBER';
  userId: string;
  user?: UserPublic;
  permissions?: Record<string, boolean> | undefined;
};

const MemberItem = ({
  member,
  assignableRoles,
  me,
  params,
}: {
  member: Member;
  me: { id?: string };
  assignableRoles: WorkspaceRole[];
  params: { workspaceId: string; memberId: string };
}) => {
  const assignRole = useMutation(assignWorkspaceMemberRoleMutationOptions(params));

  const isYou = (member: { user?: { id?: string } }) => {
    return member.user?.id === me?.id;
  };

  const handleChangeRole = (newRole: WorkspaceRole) => {
    if (assignRole.isPending) return;
    toast.promise(assignRole.mutateAsync({ role: newRole }), {
      loading: 'Updating role...',
      success: 'Role updated successfully!',
      error: (e) => `Failed to update role. ${e?.message || ''}`,
    });
  };

  const selectableRoles = useMemo(() => assignableRoles.map(formatWsRole), [assignableRoles]);

  const isDisabled = useMemo(() => {
    return !hasWsMemberPermission('assign_role', member.permissions);
  }, [member, selectableRoles]);

  return (
    <div key={member.id} className='flex items-center gap-4'>
      <Avatar>
        <AvatarImage src={member.user?.avatar || undefined} />
        <AvatarFallback>{get(member, 'user.name', 'U').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium leading-none'>{member.user?.name}</p>
        <p className='text-sm text-muted-foreground truncate'>
          {member.user?.email || 'No email'} {isYou(member) ? '(You)' : ''}
        </p>
      </div>
      <Select
        disabled={isDisabled}
        value={member.role}
        onValueChange={(value) => {
          const exits = assignableRoles.find((r) => r === value);
          if (exits) handleChangeRole(exits);
          else toast.error('You cannot assign this role');
        }}
      >
        <SelectTrigger className='w-[120px]'>
          <SelectValue placeholder='Select a role'>{formatWsRole(member.role).label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {selectableRoles.map(({ value: role, label }) => (
            <SelectItem key={role} value={role}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MemberActions
        params={params}
        hiddens={{
          leave: !isYou(member),
          delete: isYou(member) || !hasWsMemberPermission('revoke', member.permissions),
        }}
        // disables={}
      />
    </div>
  );
};

export const MembersList = ({
  workspaceId,
  permissions,
}: {
  workspaceId: string;
  permissions: Record<string, boolean> | undefined;
}) => {
  const { data: me } = useSuspenseQuery(getMeQueryOptions());
  const { data: members } = useSuspenseQuery(fetchWorkspaceMembersQueryOptions({ workspaceId }));

  const assignableRoles = useMemo(() => {
    if (!permissions) return [];
    const roles: WorkspaceRole[] = [];
    if (hasWorkspacePermission('members:manage#admin', permissions)) roles.push('WS_ADMIN');
    if (hasWorkspacePermission('members:manage#member', permissions)) roles.push('WS_MEMBER');
    return roles;
  }, [permissions]);

  return (
    <div className='flex flex-col gap-4 max-h-72 overflow-y-auto'>
      <div className='text-sm font-medium'>
        People with access
        <span className='ml-2 text-gray-500'>({members?.length || 0})</span>
      </div>

      <div className='grid gap-6'>
        {members?.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
            me={me}
            assignableRoles={assignableRoles}
            params={{ workspaceId, memberId: member.id }}
          />
        )) || null}
      </div>
    </div>
  );
};
