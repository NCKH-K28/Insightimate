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
import { DurationPresetSelectors } from '../selectors/duration-preset-selectors';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePicker } from '@/components/date-range-picker';
import { useMemo } from 'react';

const ZUpdateFormData = ZBoardSprintUpdateInput.superRefine(validateBoardSprint);
export type UpdateFormData = z.infer<typeof ZUpdateFormData>;

type UpdateSprintFormProps = {
  params: { boardId: string; sprintId: string };
  defaultValues?: Partial<UpdateFormData>;
  onSuccess?: () => void;
};

export const UpdateSprintForm = ({ params, defaultValues, onSuccess }: UpdateSprintFormProps) => {
  const updateSprint = useMutation(updateBoardSprintMutationOptions(params));

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(ZUpdateFormData),
    defaultValues: {
      name: '',
      goal: '',
      startAt: undefined,
      endAt: undefined,
      ...defaultValues,
    },
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

  const dates = useMemo(() => {
    const startAt = form.getValues('startAt');
    const endAt = form.getValues('endAt');
    if (!startAt || !endAt) return undefined;
    return { from: new Date(startAt), to: new Date(endAt) };
  }, [form]);

  const onDatesChange = (dates?: { from?: Date; to?: Date }) => {
    const startAt = dates?.from;
    const endAt = dates?.to;
    const options = { shouldDirty: true, shouldTouch: true, shouldValidate: true };
    if (!startAt) {
      form.setValue('startAt', undefined, options);
      form.setValue('endAt', undefined, options);
      return;
    }
    form.setValue('startAt', format(startAt, 'yyyy-MM-dd'), options);
    if (endAt) form.setValue('endAt', format(endAt, 'yyyy-MM-dd'), options);
    else form.setValue('endAt', format(startAt, 'yyyy-MM-dd'), options);
  };

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
              <FormLabel>
                Name<span className='text-red-500'>*</span>
              </FormLabel>
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
                <Textarea
                  placeholder='Sprint Goal'
                  {...field}
                  value={field.value ?? ''}
                  rows={4}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DurationPresetSelectors value={'custom'} onValueChange={() => {}} disabled />

        <FormItem>
          <FormLabel>Date Range</FormLabel>
          <FormControl>
            <DateRangePicker dates={dates} onDatesChange={onDatesChange} />
          </FormControl>
          <FormMessage />
        </FormItem>

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
