import { deleteWorkspaceMutationOptions } from '@/features/workspaces/api/actions';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

type DeleteWorkspaceFormProps = {
  params: { workspaceId: string };
  onSuccess?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
};

export const DeleteWorkspaceForm = ({
  params,
  onSuccess,
  onSubmit,
  onCancel,
}: DeleteWorkspaceFormProps) => {
  const deleteMutation = useMutation(deleteWorkspaceMutationOptions(params));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
    await toast
      .promise(deleteMutation.mutateAsync({}), {
        loading: 'Deleting workspace...',
        success: 'Workspace deleted successfully',
        error: (err) => `Error deleting workspace: ${err.message}`,
      })
      .unwrap()
      .then(() => {
        onSuccess?.();
      });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <DialogDescription>
        Are you sure you want to delete this workspace? This action cannot be undone.
      </DialogDescription>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={deleteMutation.isPending}
        >
          Cancel
        </Button>
        <Button type='submit' variant='destructive' disabled={deleteMutation.isPending}>
          {deleteMutation.isPending && <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />}
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogFooter>
    </form>
  );
};
