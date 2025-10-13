import {
  listProjectRolesQueryOptions,
  writeProjectRolesMutationOptions,
} from '@/features/projects/api/actions';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect } from 'react';
import {
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectRolePermissionKey,
  ProjectRoleWriteInput,
  ZProjectRoleWriteInput,
} from '@/contracts/projects';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { RemoveRoleButton } from '../buttons/remove-role-button';
import AddRoleButton from '../buttons/add-role-button';
import { ArchiveRestore, Loader2Icon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { isDelete, RoleState, useRoleManagement } from '../../hooks/use-role-management';
import { Badge } from '@/components/ui/badge';

type WriteRoleFormData = ProjectRoleWriteInput;

const PermissionBadge: React.FC<{
  permission: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ permission, isActive, disabled, onClick }) => {
  return (
    <Badge
      variant={isActive ? 'default' : 'outline'}
      className={cn('cursor-pointer select-none p-1 text-xs font-medium', {
        'opacity-50 cursor-not-allowed': disabled,
      })}
      onClick={disabled ? undefined : onClick}
    >
      {permission}
    </Badge>
  );
};

const ActionButton: React.FC<{
  role: RoleState;
  translatableRoles: RoleState[];
  onDelete: (roleId: string, action?: 'delete' | `delete:${string}#transient`) => void;
  onRestore: (roleId: string) => void;
}> = ({ role, translatableRoles, onDelete, onRestore }) => {
  if (!role.action || role.action === 'update') {
    return (
      <RemoveRoleButton
        id={role.id}
        roles={translatableRoles.filter((r) => r.id !== role.id)}
        onConfirm={(confirmation) => {
          const action: 'delete' | `delete:${string}#transient` =
            confirmation.action === 'transient'
              ? `delete:${confirmation.reassignTo}#transient`
              : 'delete';
          onDelete(role.id, action);
        }}
      />
    );
  }

  if (role.action === 'create') {
    return (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={() => onDelete(role.id, 'delete')}
        title='Remove new role'
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    );
  }

  if (isDelete(role.action)) {
    return (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={() => onRestore(role.id)}
        title='Restore role'
      >
        <ArchiveRestore className='h-4 w-4' />
      </Button>
    );
  }

  throw new Error(`Invalid role action: ${role.action}`);
};

const RoleRow: React.FC<{
  role: RoleState;
  translatableRoles: RoleState[];
  assignablePermissions: ProjectRolePermissionKey[];
  hasPermission: (roleId: string, permission: string) => boolean;
  onDelete: (roleId: string, action?: 'delete' | `delete:${string}#transient`) => void;
  onRestore: (roleId: string) => void;
  onRoleChange: (
    roleId: string,
    updates: Partial<Omit<RoleState, 'id' | 'original' | 'action'>>,
  ) => void;
}> = ({
  role,
  translatableRoles,
  assignablePermissions,
  hasPermission,
  onDelete,
  onRestore,
  onRoleChange,
}) => {
  const rowClassName = cn('hover:bg-accent/50 group relative transition-colors', {
    'opacity-60 bg-muted/30': isDelete(role.action ?? ''),
    '[&>td]:line-through [&>td]:decoration-muted-foreground/70 [&>td]:text-muted-foreground':
      isDelete(role.action ?? ''),
  });

  const togglePermission = (permission: ProjectRolePermissionKey) => {
    const permSet = new Set(role.permissions || []);
    if (permSet.has(permission)) permSet.delete(permission);
    else permSet.add(permission);
    const updatedRole: RoleState = { ...role, permissions: Array.from(permSet) };
    onRoleChange(role.id, updatedRole);
  };

  return (
    <TableRow
      className={rowClassName}
      data-state={role.action && isDelete(role.action) ? 'deleted' : 'active'}
    >
      <TableCell className='overflow-hidden align-top font-medium'>
        {role.name}
        {role.action == 'create' && <span className='ml-2 text-xs text-blue-600'>(New)</span>}
        {role.action == 'update' && <span className='ml-2 text-xs text-amber-600'>(Modified)</span>}
      </TableCell>

      <TableCell className='overflow-hidden align-top'>
        <p className='whitespace-normal line-clamp-2 lg:line-clamp-3'>{role.description}</p>
      </TableCell>

      <TableCell className='align-top'>
        <div className='flex flex-wrap gap-2'>
          {assignablePermissions.map((permission) => (
            <PermissionBadge
              key={permission}
              permission={permission}
              isActive={hasPermission(role.id, permission)}
              disabled={isDelete(role.action)}
              onClick={() => togglePermission(permission)}
            />
          ))}
        </div>
      </TableCell>

      <TableCell className='align-top'>
        <ActionButton
          role={role}
          translatableRoles={translatableRoles}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      </TableCell>
    </TableRow>
  );
};

const RolePermissionMatrix: React.FC<{
  roles: RoleState[];
  translatableRoles: RoleState[];
  hasPermission: (roleId: string, permission: string) => boolean;
  onDelete: (roleId: string, action?: 'delete' | `delete:${string}#transient`) => void;
  onRestore: (roleId: string) => void;
  onRoleChange: (
    roleId: string,
    updates: Partial<Omit<RoleState, 'id' | 'original' | 'action'>>,
  ) => void;
}> = ({ roles, translatableRoles, hasPermission, onDelete, onRestore, onRoleChange }) => {
  const assignablePermissions = useMemo(
    () => Object.values(PROJECT_ROLE_PERMISSION_KEYS).sort(),
    [],
  );

  return (
    <div className='overflow-auto'>
      <Table className='table-fixed'>
        <TableHeader>
          <TableRow>
            <TableHead className='md:w-[220px]'>Role</TableHead>
            <TableHead className='hidden md:table-cell md:w-[360px]'>Description</TableHead>
            <TableHead className='hidden lg:table-cell'>Permissions</TableHead>
            <TableHead className='w-[72px] md:w-[96px] text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onRoleChange={onRoleChange}
              translatableRoles={translatableRoles}
              assignablePermissions={assignablePermissions}
              hasPermission={hasPermission}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Main Component
export const PermissionSettings: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: rawRoles, isPending: isLoadingRoles } = useQuery(
    listProjectRolesQueryOptions({ projectId }),
  );

  const {
    addRole,
    updateRole,
    deleteRole,
    restoreRole,
    reset,
    hasPermission,
    roles,
    translatableRoles,
  } = useRoleManagement(projectId, rawRoles);

  const form = useForm<WriteRoleFormData>({
    resolver: zodResolver(ZProjectRoleWriteInput),
    defaultValues: { projectId, delete: [], create: [], update: [] },
    mode: 'onChange',
  });

  const formData = useMemo((): WriteRoleFormData => {
    const data: WriteRoleFormData = { projectId, create: [], update: [], delete: [] };

    roles.forEach((role) => {
      if (!role.action) return;
      if (role.action === 'create') {
        if (!data.create) data.create = [];
        data.create.push(role);
      } else if (role.action === 'update') {
        if (!data.update) data.update = [];
        data.update.push(role);
      } else if (isDelete(role.action)) {
        if (!data.delete) data.delete = [];
        if (role.action) data.delete.push({ id: role.id, action: role.action });
        else throw new Error('Invalid state: deleted role must have an action');
      } else {
        throw new Error(`Invalid role action: ${role.action}`);
      }
    });

    return data;
  }, [roles]);

  useEffect(() => {
    form.setValue('create', formData.create, { shouldDirty: true, shouldValidate: true });
    form.setValue('update', formData.update, { shouldDirty: true, shouldValidate: true });
    form.setValue('delete', formData.delete, { shouldDirty: true, shouldValidate: true });
  }, [formData, form]);

  const writeProjectRoles = useMutation(writeProjectRolesMutationOptions({ projectId }));

  const handleSubmit = form.handleSubmit(async (data: WriteRoleFormData) => {
    await toast
      .promise(writeProjectRoles.mutateAsync(data), {
        loading: 'Saving changes...',
        success: 'Changes saved successfully',
        error: (err) => err.message || 'Failed to save changes',
      })
      .unwrap();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='size-full'>
        <div
          id='permissions'
          className='size-full'
          //
        >
          <div className='w-full'>
            <h1 className='text-2xl font-bold'>Permission Settings</h1>
            <p className='text-muted-foreground'>Manage project roles and their permissions.</p>
          </div>

          {isLoadingRoles && (
            <div className='flex items-center justify-center p-20'>
              <Loader2Icon className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          )}

          <div hidden={isLoadingRoles}>
            <div className='flex flex-row justify-end'>
              <AddRoleButton
                params={{ projectId }}
                projectId={projectId}
                onConfirm={(v) => {
                  addRole({
                    name: v.name,
                    description: v.description,
                    permissions: v.permissions || [],
                    projectId,
                  });
                }}
              />

              <Button
                type='button'
                variant='link'
                className='mr-2'
                onClick={reset}
                disabled={form.formState.isSubmitting || form.formState.isDirty === false}
              >
                Reset
              </Button>
            </div>

            <RolePermissionMatrix
              roles={roles}
              onDelete={deleteRole}
              onRestore={restoreRole}
              onRoleChange={updateRole}
              translatableRoles={translatableRoles}
              hasPermission={hasPermission}
            />

            <div className='flex items-center justify-between p-4 rounded-lg'>
              <div className='text-sm text-blue-800'></div>
              <Button
                type='submit'
                disabled={
                  form.formState.isSubmitting ||
                  form.formState.isDirty === false ||
                  form.formState.isValid === false
                }
                className='ml-4'
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className='ml-2 h-4 w-4 animate-spin' />
                )}
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : form.formState.isDirty
                  ? 'Save Changes'
                  : 'No Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
