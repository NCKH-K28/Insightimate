import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { DeleteWorkspaceForm } from '../forms/delete-workspace-form';

type DeleteWorkspaceBtnProps = {
  params: { workspaceId: string };
  label?: string;
  onSuccess?: () => void;
  disable?: boolean;
  hidden?: boolean;
};

export const DeleteWorkspaceBtn = ({
  params,
  onSuccess,
  label = 'Delete Workspace',
  disable,
  hidden,
}: DeleteWorkspaceBtnProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disable} hidden={hidden}>
        <Button>{label}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Workspace</DialogTitle>
        </DialogHeader>
        <DeleteWorkspaceForm
          params={params}
          onSuccess={onSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
