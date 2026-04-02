import {
  addProjectMemberMutationOptions,
  deleteProjectMembersMutationOptions,
  listProjectMembersQueryOptions,
  listProjectRolesQueryOptions,
  updateProjectMembersMutationOptions,
} from '@/features/project/api/actions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AddTeamDialogButton } from '../buttons/add-team-dialog-button';
import { AddUserDialogButton } from '../buttons/add-user-dialog-button';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import MemberRow from './member-row';

export const MemberSettings = (props: { projectId: string }) => {
  const pathname = usePathname();

  const { projectId } = props;
  const context = useMemo(() => ({ projId: projectId }), [projectId]);

  const addMember = useMutation(addProjectMemberMutationOptions(context));
  const { data: members, isPending: isLoadingMembers } = useQuery(
    listProjectMembersQueryOptions(context),
  );
  const { data: roles, isLoading: isLoadingRoles } = useQuery(
    listProjectRolesQueryOptions(context),
  );
  const deleteMember = useMutation(deleteProjectMembersMutationOptions(context));
  const updateMember = useMutation(updateProjectMembersMutationOptions(context));

  const teamsPath = useMemo(() => {
    const reg = /(.*\/wps\/[^/]+)\/.*/;
    return pathname?.replace(reg, '$1/teams') || '/teams';
  }, [pathname]);

  const handleAddMember = async (data: Parameters<typeof addMember.mutateAsync>[0]) => {
    await toast
      .promise(addMember.mutateAsync(data), {
        loading: 'Adding member...',
        success: 'Member added successfully!',
        error: (err) => `Error adding member: ${err.message}`,
      })
      .unwrap();
  };

  const handleUpdateMember = async (data: Parameters<typeof updateMember.mutateAsync>[0][0]) => {
    if (updateMember.isPending) return;
    await toast
      .promise(updateMember.mutateAsync([data]), {
        success: 'Member updated successfully!',
        error: (err) => `Error updating member: ${err.message}`,
      })
      .unwrap();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (deleteMember.isPending) return;
    await toast
      .promise(deleteMember.mutateAsync([memberId]), {
        loading: 'Removing member...',
        success: 'Member removed successfully!',
        error: (err) => `Error removing member: ${err.message}`,
      })
      .unwrap();
  };

  return (
    <Collapsible defaultOpen={true} open={true}>
      <CollapsibleTrigger className='w-full text-left'>
        <h2 className='text-2xl font-semibold mb-4'>Member Settings</h2>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='flex items-center justify-end mb-4 space-x-2'>
          <AddTeamDialogButton projectId={projectId} onAdd={handleAddMember} />
          <AddUserDialogButton projectId={projectId} />
        </div>
        <div className='space-y-4'>
          {isLoadingMembers && <p className='text-sm text-muted-foreground'>Loading...</p>}

          {members?.length === 0 && (
            <p className='text-sm text-muted-foreground'>No members found.</p>
          )}
          {members?.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              actor={member.actor}
              teamsPath={teamsPath}
              canEditRole={true}
              roles={roles || []}
              isRolesPending={isLoadingRoles}
              refetchRoles={() => Promise.resolve()}
              onRemove={() => handleRemoveMember(member.id)}
              onChangeRole={(roleId) => handleUpdateMember({ id: member.id, roleId })}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
