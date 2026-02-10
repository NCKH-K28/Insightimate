'use client';

import React, { useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectRolePermissionKey,
  ZProjectRoleCreateInput,
} from '@/contracts/project';
import z from 'zod';

const ZAddRoleForm = ZProjectRoleCreateInput;
type AddRoleFormData = z.infer<typeof ZAddRoleForm>;

export interface AddRoleButtonProps {
  projectId: string;
  disabled?: boolean;
  onConfirm?: (payload: AddRoleFormData) => Promise<void> | void;
  params: { projectId: string };
}

export const AddRoleButton: React.FC<AddRoleButtonProps> = ({ disabled, onConfirm, params }) => {
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(ZAddRoleForm),
    mode: 'onChange',
    defaultValues: { name: '', description: '', permissions: [], projectId: params.projectId },
  });

  const permissions = useMemo(() => form.getValues('permissions'), [form]);

  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);
  const isPermissionAssigned = React.useCallback(
    (perm: ProjectRolePermissionKey) => permissionsSet.has(perm),
    [permissionsSet],
  );

  const togglePermission = React.useCallback(
    (perm: ProjectRolePermissionKey) => {
      const permissions = new Set(form.getValues('permissions'));
      if (permissions.has(perm)) permissions.delete(perm);
      else permissions.add(perm);
      form.setValue('permissions', Array.from(permissions));
    },
    [form],
  );

  const handleSubmit = form.handleSubmit(
    async (data) => {
      if (onConfirm) {
        await onConfirm(data);
        form.reset();
        setOpen(false);
        return;
      }
    },
    async (errors) => {
      console.log('Form errors:', errors);
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} type='button'>
          <PlusIcon className='mr-2 h-4 w-4' /> Add Role
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Create new role</DialogTitle>
          <DialogDescription>
            Define a role name, optional description, and its permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            className='space-y-4 py-4'
          >
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='role-name'>
                    Name <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input id='role-name' placeholder='e.g. Maintainer' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='role-description'>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id='role-description'
                      placeholder='What can members of this role do?'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='permissions'
              control={form.control}
              render={({}) => (
                <FormItem>
                  <FormLabel htmlFor='perm-input'>Permissions</FormLabel>
                  <FormControl>
                    <ScrollArea className='max-h-56 rounded-md border'>
                      {PROJECT_ROLE_PERMISSION_KEYS.map((perm) => (
                        <Badge
                          key={perm}
                          className='m-1 cursor-pointer select-none'
                          onClick={() => togglePermission(perm)}
                          variant={isPermissionAssigned(perm) ? 'default' : 'outline'}
                        >
                          {perm}
                        </Badge>
                      ))}
                    </ScrollArea>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              form.reset();
              setOpen(false);
            }}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={form.formState.isSubmitting || !form.formState.isValid}
            className='cursor-pointer'
            onClick={() => handleSubmit()}
          >
            {form.formState.isSubmitting && <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />}
            {form.formState.isSubmitting ? 'Adding…' : 'Add Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoleButton;
