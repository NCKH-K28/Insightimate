'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import React from 'react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ZAIAgentCreateInput } from '@/contracts/agents';
import { createAgentMutationOptions } from '../../api/actions';
import { Textarea } from '@/components/ui/textarea';

export const ZCreateFormData = ZAIAgentCreateInput;
type CreateFormData = z.infer<typeof ZCreateFormData>;

type NewPageProps = {
  values: { workspaceId: string };
  onSubmit?: (data: CreateFormData) => void;
  onSuccess?: (data: CreateFormData & { id: string }) => void;
};
export const CreateAgentForm = ({ values, onSubmit }: NewPageProps) => {
  const form = useForm({
    resolver: zodResolver(ZCreateFormData),
    values: { workspaceId: values.workspaceId, name: '', description: '', instructions: '' },
  });

  const createAgent = useMutation(createAgentMutationOptions());

  const handleSubmit = form.handleSubmit((data) => {
    if (onSubmit) onSubmit(data);
    return toast
      .promise(createAgent.mutateAsync(data), {
        loading: 'Creating agent...',
        success: 'Agent created successfully!',
        error: (err) => `Error: ${err.message}`,
      })
      .unwrap()
      .then((res) => {
        if (onSubmit) onSubmit(res);
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='p-6 space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Agent Name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder='Agent Description' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='instructions'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Agent Instructions'
                  className='resize-none'
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Button type='submit' disabled={form.formState.isSubmitting || !form.formState.isValid}>
            {form.formState.isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            {form.formState.isSubmitting ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
