import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ZBoardIssueCreateInput } from '@/contracts/boards/boards.input';
import z from 'zod';
import React from 'react';
import { Loader2, PlusIcon, X } from 'lucide-react';
import { IssueFieldOption, IssueFieldSelectors } from '../selectors/issue-field-selectors';
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { DottedSeparator } from '@/components/dotted-separator';

const ZFormData = ZBoardIssueCreateInput;
type FormData = z.infer<typeof ZFormData>;

export type CreateIssueFormProps = {
  params: { projectId: string };
  onCancel?: () => void;
  onSubmit?: (data: FormData) => void | Promise<void>;
};

export const CreateIssueForm = ({ params, onCancel, onSubmit }: CreateIssueFormProps) => {
  const [typeSelected, setTypeSelected] = React.useState<IssueFieldOption | null>(null);
  const [prioritySelected, setPrioritySelected] = React.useState<IssueFieldOption | null>(null);

  const form = useForm({
    mode: 'onChange',
    resolver: zodResolver(ZFormData),
    defaultValues: { summary: '', description: '' },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (onSubmit) return onSubmit(data);
  });

  const handleCancel = () => {
    form.reset();
    setTypeSelected(null);
    setPrioritySelected(null);
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Main Content Section */}
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='summary'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base font-semibold'>
                  Summary <span className='text-destructive'>*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter a brief summary of the issue'
                    className='h-11'
                    autoFocus
                    {...field}
                  />
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
                <FormLabel className='text-base font-semibold'>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Add more details about the issue...'
                    className='min-h-[120px] resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DottedSeparator />

        {/* Metadata Section */}
        <div className='space-y-4'>
          <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            Issue Details
          </h3>

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='typeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>Type</FormLabel>
                  <FormControl>
                    <IssueFieldSelectors
                      value={typeSelected}
                      onChange={(value) => {
                        setTypeSelected(value);
                        field.onChange(value?.value);
                      }}
                      fetchQueryOptions={() => ({
                        ...getProjectQueryOptions(params),
                        select: (res) => res.types,
                      })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='priorityId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>Priority</FormLabel>
                  <FormControl>
                    <IssueFieldSelectors
                      value={prioritySelected}
                      onChange={(value) => {
                        setPrioritySelected(value);
                        field.onChange(value?.value);
                      }}
                      fetchQueryOptions={() => ({
                        ...getProjectQueryOptions(params),
                        select: (res) => res.priorities,
                      })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DottedSeparator />

        {/* Action Buttons */}
        <DialogFooter className='gap-2 sm:gap-0'>
          <div className='flex justify-end items-center gap-2 w-full'>
            <Button
              variant='ghost'
              type='button'
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              className='min-w-[100px]'
            >
              {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {form.formState.isSubmitting ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
};
