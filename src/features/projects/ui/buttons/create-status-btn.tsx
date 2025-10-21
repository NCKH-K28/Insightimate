import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import z from 'zod';
import React from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ZIssueStatusCreateInput } from '@/contracts/issues/issues.input';
import { CreateStatusForm } from '@/features/projects/ui/forms/create-status-form';

type FormData = z.infer<typeof ZIssueStatusCreateInput>;

type CreateStatusButtonProps = {
  projectId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
};

export const CreateStatusButton = ({ 
  projectId, 
  variant = 'default', 
  size = 'sm',
  className 
}: CreateStatusButtonProps) => {
  const [open, setOpen] = React.useState(false);

  const queryClient = useQueryClient();
  const createMutationOptions = mutationOptions({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/v2/projects/${projectId}/issue-statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'statuses'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setOpen(false);
    },
  });

  const createStatus = useMutation(createMutationOptions);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <PlusIcon className='h-4 w-4' />
          <span className='ml-1.5'>New Status</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='text-2xl font-bold'>Create New Status</DialogTitle>
          <DialogDescription className='text-base'>
            Create a new status for organizing your issues. Choose a category to determine which column it belongs to.
          </DialogDescription>
        </DialogHeader>
        <CreateStatusForm
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            toast.promise(createStatus.mutateAsync(data), {
              loading: 'Creating status...',
              success: 'Status created successfully!',
              error: (e) => `Error creating status: ${e.message || e}`,
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
