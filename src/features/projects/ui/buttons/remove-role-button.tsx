'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2Icon } from 'lucide-react';
import type { ProjectRole } from '@/contracts/projects';

export type RemoveRoleAction = 'transient' | 'delete';

export interface RemoveRoleButtonProps {
  id: string;
  roles: ProjectRole[];
  disabled?: boolean;
  onConfirm: (
    payload: { roleId: string } & (
      | { action: 'delete' }
      | { action: 'transient'; reassignTo: string }
    ),
  ) => Promise<void> | void;
}

export const RemoveRoleButton: React.FC<RemoveRoleButtonProps> = ({
  id,
  roles,
  disabled,
  onConfirm,
}) => {
  const [open, setOpen] = React.useState(false);

  // roles we can reassign to (excluding the one being deleted)
  const restRoles = React.useMemo(() => roles.filter((r) => r.id !== id), [roles, id]);

  const [action, setAction] = React.useState<RemoveRoleAction>(
    restRoles.length ? 'transient' : 'delete',
  );
  const [reassignToRoleId, setReassignToRoleId] = React.useState<string | undefined>(
    restRoles[0]?.id,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // If roles change (or the last alternative role disappears), force a valid state
  React.useEffect(() => {
    if (restRoles.length === 0) {
      setAction('delete');
      setReassignToRoleId(undefined);
    } else if (!reassignToRoleId) {
      setReassignToRoleId(restRoles[0].id);
    }
  }, [restRoles, reassignToRoleId]);

  const handleConfirm = async () => {
    setError(null);
    if (action === 'transient' && !reassignToRoleId) {
      setError('Please choose a role to reassign members to.');
      return;
    }

    try {
      setSubmitting(true);
      if (action === 'delete') await onConfirm({ roleId: id, action });
      else if (action === 'transient' && reassignToRoleId) {
        await onConfirm({ roleId: id, action, reassignTo: reassignToRoleId });
      } else throw new Error('Invalid action');
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' variant='destructive' size='sm' disabled={disabled}>
          <Trash2Icon className='h-4 w-4' />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Role Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this role? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <Select
              value={action}
              onValueChange={(v) => setAction((v as RemoveRoleAction) ?? 'delete')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Action' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='delete'>Delete all members</SelectItem>
                <SelectItem value='transient' disabled={restRoles.length === 0}>
                  Reassign to another role
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'transient' && restRoles.length > 0 && (
            <div>
              <p className='mb-2 text-sm text-muted-foreground'>Reassign members to:</p>
              <Select value={reassignToRoleId} onValueChange={setReassignToRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select Role' />
                </SelectTrigger>
                <SelectContent>
                  {restRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className='text-sm text-destructive'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveRoleButton;
