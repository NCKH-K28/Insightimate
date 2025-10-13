import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { LeaveWorkspaceForm } from '../forms';

type LeaveWorkspaceBtnProps = {
  params: { workspaceId: string };
  label?: string;
  renderLabel?: (isOpen: boolean) => React.ReactNode;
  onSuccess?: () => void;
};

export const LeaveWorkspaceBtn = ({
  params,
  label = 'Leave Workspace',
  renderLabel,
  onSuccess,
}: LeaveWorkspaceBtnProps) => {
  const [open, setOpen] = useState(false);

  const renderedLabel = renderLabel ? renderLabel(open) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {renderedLabel ? renderedLabel : <Button variant='destructive'>{label}</Button>}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Workspace</DialogTitle>
        </DialogHeader>
        <LeaveWorkspaceForm params={params} onSuccess={onSuccess} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
