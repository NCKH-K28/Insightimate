 

import { useMutation } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZBoardSprintUpdateInput } from '@/contracts/boards/boards.input';
import z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns/format';
import { Loader2Icon } from 'lucide-react';
import { updateBoardSprintMutationOptions } from '../../api/actions';
import { validateBoardSprint } from '@/lib/validators';
import { cn } from '@/lib/utils';
import { DurationPresetSelectors } from '../selectors/duration-preset-selectors';
import { IssueDateSelectors } from '../selectors/issue-date-selectors';

const dateToOption = (date?: string | null) => {
  if (!date) return null;
  const d = new Date(date);
  return { label: d.toDateString(), value: d };
};

const optionToIsoDate = (option: { label: string; value: Date | null } | null) => {
  if (!option || !option.value) return null;
  return format(option.value, 'yyyy-MM-dd');
};

const ZUpdateFormData = ZBoardSprintUpdateInput.superRefine(validateBoardSprint);
export type UpdateFormData = z.infer<typeof ZUpdateFormData>;

type UpdateSprintFormProps = {
  params: { boardId: string; sprintId: string };
  defaultValues?: Partial<UpdateFormData>;
  onSuccess?: () => void;
};

export const UpdateSprintForm = ({ params, defaultValues, onSuccess }: UpdateSprintFormProps) => {
  const updateSprint = useMutation(updateBoardSprintMutationOptions(params));

  // log
  console.log('defaultValues', defaultValues);
  const form = useForm<UpdateFormData>({
    resolver: zodResolver(ZUpdateFormData),
    defaultValues: { name: '', goal: '', ...defaultValues },
    mode: 'onBlur',
  });

  const getDirtyValues = () => {
    const values = form.getValues();
    const dirtyFields = form.formState.dirtyFields;
    return Object.keys(dirtyFields).reduce((acc, key) => {
      (acc as any)[key] = (values as any)[key];
      return acc;
    }, {} as Partial<UpdateFormData>);
  };

  const handleSubmit = form.handleSubmit(() => {
    const dirtyValues = getDirtyValues();
    return updateSprint.mutateAsync(dirtyValues, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(e);
        }}
        className='space-y-4'
      >
        <FormField
          name='name'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Sprint Name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name='goal'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <FormControl>
                <Input placeholder='Sprint Goal' {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DurationPresetSelectors value={'custom'} onValueChange={() => {}} disabled />

        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', 'items-start')}>
          <FormField
            name='startAt'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start At</FormLabel>
                <FormControl>
                  <IssueDateSelectors
                    value={dateToOption(field.value)}
                    onChange={(date) => field.onChange(optionToIsoDate(date))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name='endAt'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>End At</FormLabel>
                <FormControl>
                  <IssueDateSelectors
                    value={dateToOption(field.value)}
                    onChange={(date) => field.onChange(optionToIsoDate(date))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end pt-4'>
          <Button
            type='submit'
            className='cursor-pointer'
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? <Loader2Icon className='animate-spin' /> : null}
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
