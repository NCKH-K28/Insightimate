'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createWorkspaceMutationOptions } from '@/features/workspaces/api/actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ZWorkspaceCreateInput } from '@/contracts/workspaces';

type CreateWorkspaceFormProps = {
  onSubmit?: () => void;
  onSuccess?: () => void;
};
export const CreateWorkspaceForm = ({ onSuccess, onSubmit }: CreateWorkspaceFormProps) => {
  const form = useForm({
    resolver: zodResolver(ZWorkspaceCreateInput),
    defaultValues: { name: '' },
  });

  const createWorkspace = useMutation(createWorkspaceMutationOptions());

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.();
    toast
      .promise(createWorkspace.mutateAsync(data), {
        success: 'Workspace created successfully!',
        error: (e) => `Error creating workspace: ${e.message}`,
      })
      .unwrap()
      .then(() => onSuccess?.())
      .then(() => form.reset());
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='w-full flex flex-col gap-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='Enter workspace name'
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={form.formState.isSubmitting || !form.formState.isValid}>
          {form.formState.isSubmitting ? <LoaderCircle className='animate-spin' /> : null}
          {form.formState.isSubmitting ? 'Creating...' : 'Create Workspace'}
        </Button>
      </form>
    </Form>
  );
};
