import { Button } from '@/components/ui/button';
import { UserInvite } from '@/features/user/ui/user-invite';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addProjectMemberMutationOptions, listProjectRolesQueryOptions } from '../../api/actions';
import { useMemo } from 'react';

type AddUserDialogButtonProps = { projectId: string };
export const AddUserDialogButton = ({ projectId }: AddUserDialogButtonProps) => {
  const addUser = useMutation(addProjectMemberMutationOptions({ projectId }));
  const { data: roles } = useQuery(listProjectRolesQueryOptions({ projectId }));

  const handleAddUser = async (data: Parameters<typeof addUser.mutateAsync>[0]) => {
    await toast
      .promise(addUser.mutateAsync(data), {
        loading: 'Adding user...',
        success: 'User added successfully!',
        error: (err) => `Error adding user: ${err.message}`,
      })
      .unwrap();
  };

  // map to value-label
  const assignableRoles = useMemo(
    () => roles?.map((r) => ({ value: r.id, label: r.name })) || [],
    [roles],
  );

  return (
    <UserInvite
      disabled={addUser.isPending}
      roleOptions={assignableRoles}
      dialogDescription='Add users to this project, user must be in workspace.'
      onInviteClick={({ users, role }) => {
        if (!role) return;
        users.forEach((u) => {
          handleAddUser({ roleId: role, actorType: 'USER', actorId: u.id, projectId });
        });
      }}
      params={{ resourceType: 'PROJECT', resourceId: projectId }}
      renderTrigger={() => <Button size='sm'>Add User</Button>}
    />
  );
};
