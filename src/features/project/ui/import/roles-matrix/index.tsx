import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';

import { useRolesMatrix } from './use-roles-matrix';
import { RoleDialog } from './role-dialog';
import { RolesTable } from './roles-table';
import { RolesMatrixProps } from './types';

export default function RolesMatrix(props: RolesMatrixProps) {
  const {
    title = 'Role Matrix',
    description = 'Manage roles & permissions in a matrix format (permission × role).',
    basePermissions,
  } = props;

  const {
    roles,
    filteredPerms,
    searchPerm,
    setSearchPerm,
    dialogState,
    draftName,
    setDraftName,
    draftDescription,
    setDraftDescription,
    draftPerms,
    setDraftPerms,
    activeRole,
    openDialog,
    closeDialog,
    submitDialog,
    togglePermission,
    setAllPerms,
    deleteRole,
    normalizePerms,
  } = useRolesMatrix(props);

  return (
    <Card className='p-4 rounded-2xl shadow-sm gap-2'>
      <CardHeader className='p-0 gap-2'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-xl'>{title}</CardTitle>
            <CardDescription className='mt-1'>{description}</CardDescription>
          </div>
          <Button onClick={() => openDialog('add')} className='gap-2'>
            <Plus className='h-4 w-4' /> Add Role
          </Button>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <Input
              value={searchPerm}
              onChange={(e) => setSearchPerm(e.target.value)}
              placeholder='Search permissions...'
              className='w-full sm:w-70'
            />
            <Badge variant='secondary'>{filteredPerms.length} permissions</Badge>
          </div>
          <div className='text-sm text-muted-foreground'>
            {roles.length === 0 ? 'No roles yet.' : `${roles.length} roles`}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className='p-0'>
        <RolesTable
          roles={roles}
          basePermissions={basePermissions}
          filteredPerms={filteredPerms}
          onEditRole={(role) => openDialog('edit', role)}
          onSetAllPerms={setAllPerms}
          onDeleteRole={deleteRole}
          onTogglePermission={togglePermission}
        />
      </CardContent>

      <RoleDialog
        open={dialogState.type !== null}
        onOpenChange={(open) => !open && closeDialog()}
        mode={dialogState.type}
        draftName={draftName}
        setDraftName={setDraftName}
        draftDescription={draftDescription}
        setDraftDescription={setDraftDescription}
        draftPerms={draftPerms}
        setDraftPerms={setDraftPerms}
        basePermissions={basePermissions}
        onSubmit={submitDialog}
        onCancel={closeDialog}
        activeRole={activeRole}
        normalizePerms={normalizePerms}
      />
    </Card>
  );
}
