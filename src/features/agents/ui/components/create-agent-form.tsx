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
import { MuilSelectors } from '../selectors/muil-selectors';
import React from 'react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { searchProjectsQueryOptions } from '@/features/projects/api/actions';

export const ZCreateAgentForm = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workspaceId: z.string().min(1),
  sources: z.array(z.string()).optional(),
});
export type CreateAgentFormData = z.infer<typeof ZCreateAgentForm>;

type NewPageProps = {
  values: { workspaceId: string };
  onSubmit?: (data: CreateAgentFormData) => void;
  onSuccess?: (data: CreateAgentFormData & { id: string }) => void;
};
export const CreateAgentForm = ({ values, onSubmit, onSuccess }: NewPageProps) => {
  const form = useForm({
    resolver: zodResolver(ZCreateAgentForm),
    values: { workspaceId: values.workspaceId, name: '', description: '', sources: [] },
  });

  const createAgent = useMutation({
    mutationFn: async (data: CreateAgentFormData) => {
      const response = await fetch('/api/v2/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create agent');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (onSubmit) onSubmit(data);
    return toast
      .promise(createAgent.mutateAsync(data), {
        loading: 'Creating agent...',
        success: 'Agent created successfully!',
        error: (err) => `Error: ${err.message}`,
      })
      .unwrap();
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
          name='sources'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sources</FormLabel>
              <FormControl>
                <MuilSelectors
                  onChange={(selected) => {
                    const v = selected.map((s) => s.value);
                    field.onChange(v);
                  }}
                  inputProps={{ placeholder: 'Search sources...' }}
                  className='w-full h-32 border'
                  searchQueryOptions={(q) => {
                    const filter = { q, workspaceId: values.workspaceId };
                    return queryOptions({
                      ...searchProjectsQueryOptions({ filter }),
                      select: ({ data }) => {
                        return data.map((project) => ({ value: project.id, label: project.name }));
                      },
                    });
                  }}
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
