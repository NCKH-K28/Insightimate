import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Role } from './types';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | null;
  draftName: string;
  setDraftName: (name: string) => void;
  draftDescription: string;
  setDraftDescription: (description: string) => void;
  draftPerms: string[];
  setDraftPerms: (perms: string[]) => void;
  basePermissions: string[];
  onSubmit: () => void;
  onCancel: () => void;
  activeRole?: Role | null;
  normalizePerms: (perms: string[]) => string[];
}

export function RoleDialog({
  open,
  onOpenChange,
  mode,
  draftName,
  setDraftName,
  draftDescription,
  setDraftDescription,
  draftPerms,
  setDraftPerms,
  basePermissions,
  onSubmit,
  onCancel,
  activeRole,
  normalizePerms,
}: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Role' : 'Edit Role'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new role and select initial permissions.'
              : 'Rename or update permissions for this role.'}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <label className='text-sm font-medium'>Role Name</label>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder='e.g.  Admin, Editor.. .'
            />
          </div>
          <div className='grid gap-2'>
            <label className='text-sm font-medium'>Description (optional)</label>
            <Textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder='Describe what this role can do...'
              rows={2}
            />
          </div>
          <div className='grid gap-2'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium'>Permissions</label>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary'>{draftPerms.length} selected</Badge>
                {mode === 'edit' && (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setDraftPerms(normalizePerms(basePermissions))}
                      disabled={!basePermissions.length}
                    >
                      Select all
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setDraftPerms([])}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!draftName.trim() || (mode === 'edit' && !activeRole)}
          >
            {mode === 'add' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
