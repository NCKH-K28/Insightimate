'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader, PlusIcon, XIcon } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import z from 'zod';
import { OrgMemberItem } from '@/contracts/organizations/organization.query';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const ROLE_LABELS: Record<OrgMemberItem['role'], string> = {
  ORG_OWNER: 'Org Owner',
  ORG_ADMIN: 'Org Admin',
  ORG_MEMBER: 'Org Member',
};

const ZInvitee = z.object({ email: z.email(), role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']) });
const ZAddMembersInput = z.object({ invitees: z.array(ZInvitee) });
type AddMembersInput = z.infer<typeof ZAddMembersInput>;

type AddOrgMemberDialogProps = {
  isOpen?: boolean;
  onClose?: () => void;
  roleOptions?: OrgMemberItem['role'][];
  onSend?: (i: AddMembersInput) => void | Promise<void>;
};

export const AddOrgMemberDialog: React.FC<AddOrgMemberDialogProps> = ({
  isOpen,
  onClose,
  roleOptions,
  onSend,
}) => {
  const form = useForm({
    resolver: zodResolver(ZAddMembersInput),
    defaultValues: { invitees: [] },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'invitees' });

  const handleSubmit = form.handleSubmit(
    (data) => onSend?.(data),
    (errors) => console.log('Form errors:', errors),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Invite a new member to your organization.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {fields.map((field, index) => (
              <div key={field.id} className='grid grid-cols-12 gap-2 items-start'>
                <FormField
                  control={form.control}
                  name={`invitees.${index}.email`}
                  render={({ field }) => (
                    <FormItem className='col-span-7'>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='Email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`invitees.${index}.role`}
                  render={({ field }) => (
                    <FormItem className='col-span-4'>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions?.map((role) => (
                              <SelectItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`invitees.${index}.email`}
                  render={() => (
                    <div className='col-span-1 mt-6 flex justify-end'>
                      <Button
                        type='button'
                        variant='ghost'
                        className='h-8 w-8 p-0'
                        onClick={() => remove(index)}
                      >
                        <span className='sr-only'>Remove invitee</span>
                        <XIcon className='h-4 w-4' />
                      </Button>
                    </div>
                  )}
                />
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              className='mt-2'
              onClick={() => append({ email: '', role: 'ORG_MEMBER' })}
            >
              <PlusIcon className='mr-2' />
              Add Another
            </Button>
          </form>
        </Form>
        <DialogFooter>
          <Button type='button' variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={form.getValues('invitees').length === 0 || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader className='mr-2 h-4 w-4 animate-spin' />}
            {form.formState.isSubmitting ? 'Sending...' : 'Send Invites'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
