import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const ZSprintForm = z.object({
  name: z
    .string()
    .min(1, 'Sprint name is required')
    .max(100, 'Sprint name must be at most 100 characters'),
  goal: z.string().max(500, 'Sprint goal must be at most 500 characters').optional(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
});

const ZSprintFormData = ZSprintForm.superRefine((data, ctx) => {
  const { startAt, endAt } = data;
  if (!startAt && !endAt) return;
  if (!startAt || !endAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Both start date and end date must be provided',
    });
    return;
  } else {
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
      });
    }
  }
});

type SprintFormData = z.infer<typeof ZSprintFormData>;

type SprintFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<SprintFormData>;
  onSubmit?: (data: SprintFormData) => void;
};

export function SprintForm({ mode, defaultValues, onSubmit }: SprintFormProps) {
  const form = useForm<SprintFormData>({
    resolver: zodResolver(ZSprintFormData),
    defaultValues: {
      name: defaultValues?.name || '',
      goal: defaultValues?.goal || '',
      startAt: defaultValues?.startAt || '',
      endAt: defaultValues?.endAt || '',
    },
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (onSubmit) onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprint Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter sprint name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='goal'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprint Goal</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Enter sprint goal (optional)'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='startAt'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='endAt'
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>{mode === 'create' ? 'Create Sprint' : 'Update Sprint'}</Button>
      </form>
    </Form>
  );
}
