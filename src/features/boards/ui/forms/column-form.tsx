import z from 'zod';
import { ZColumnCreateInput } from '@/contracts/boards/board.input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export const ZColumnFormData = ZColumnCreateInput;
export type ColumnFormData = z.infer<typeof ZColumnFormData>;

type ColumnFormProps = {
  mode: 'create' | 'update';
  defaultValues?: Partial<ColumnFormData>;
  statusOpts?: { id: string; name: string; color?: string; iconURL?: string }[];
  allowNewStatus?: boolean;
  onSubmit?: (data: ColumnFormData) => void;
  onCancel?: () => void;
};

const CATEGORIES = [
  { label: 'To Do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
] as const;

export const ColumnForm = ({ mode, defaultValues, onSubmit, onCancel }: ColumnFormProps) => {
  const form = useForm<ColumnFormData>({
    resolver: zodResolver(ZColumnFormData),
    defaultValues: {
      name: '',
      statuses: [{ name: 'Open', category: 'TODO', color: '#64748b' }],
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'statuses',
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit?.(data);
  });

  // Ensure at least one status exists
  useEffect(() => {
    if (fields.length === 0) {
      append({ name: 'Open', category: 'TODO', color: '#64748b' });
    }
  }, [fields.length, append]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Backlog, In Review...' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <FormLabel className='text-base font-semibold'>Statuses</FormLabel>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => append({ name: '', category: 'TODO', color: '#94a3b8' })}
            >
              <Plus className='mr-2 h-4 w-4' /> Add Status
            </Button>
          </div>
          <FormDescription>Map issues in this column to specific statuses.</FormDescription>

          <div className='flex flex-col gap-3'>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='group flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start'
              >
                <div className='flex-1 space-y-3'>
                  <div className='flex gap-3'>
                    <FormField
                      control={form.control}
                      name={`statuses.${index}.name`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormControl>
                            <Input placeholder='Status name' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`statuses.${index}.color`}
                      render={({ field }) => (
                        <FormItem className='w-[100px]'>
                          <div className='flex items-center gap-2'>
                            <FormControl>
                              <div className='relative'>
                                <Input type='color' className='h-10 w-12 p-1' {...field} />
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`statuses.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Category' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className={cn(
                    'h-8 w-8 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                    fields.length <= 1 && 'hidden',
                  )}
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          {onCancel && (
            <Button type='button' variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type='submit'>{mode === 'create' ? 'Create Column' : 'Save Changes'}</Button>
        </div>
      </form>
    </Form>
  );
};
