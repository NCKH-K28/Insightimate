import React from 'react';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { AlertCircle, Calendar, CheckCircle2, FileText, Loader2, Settings2 } from 'lucide-react';
import z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { ZBoardIssueCreateInput } from '@/contracts/boards/board.input';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { IssueDateSelectors } from '../selectors/issue-date-selectors';
import { IssueFieldOption, IssueFieldSelectors } from '../selectors/issue-field-selectors';
import { IssueType, IssueTypeSelectors } from '../selectors/issue-type-selectors';
import { IssueStatus } from '@/contracts/issues';

const ZFormData = ZBoardIssueCreateInput;
type FormData = z.infer<typeof ZFormData>;

export type CreateIssueFormProps = {
  params: { projectId: string };
  defaultValues?: Partial<FormData>;
  onCancel?: () => void;
  onSubmit?: (data: FormData) => void | Promise<void>;

  typeRequired?: boolean;
  typeFilterFn?: (type: IssueType, types: IssueType[]) => boolean;
  typeFetched?: (types: IssueType[], setValue: (value: string | null) => void) => void;

  statusRequired?: boolean;
  statusFilterFn?: (status: IssueStatus, statuses: IssueStatus[]) => boolean;
};

export const CreateIssueForm = ({
  params,
  onCancel,
  onSubmit,
  defaultValues,

  typeRequired,
  typeFilterFn,
  typeFetched,
}: CreateIssueFormProps) => {
  const [prioritySelected, setPrioritySelected] = React.useState<IssueFieldOption | null>(null);

  const form = useForm({
    mode: 'onChange',
    resolver: zodResolver(ZFormData),
    defaultValues: {
      summary: '',
      description: '',
      dueDate: null,
      startDate: null,
      ...defaultValues,
    },
  });

  const { isSubmitting, isValid, isDirty, errors } = form.formState;
  const summaryValue = useWatch({ control: form.control, name: 'summary' });
  const characterCount = summaryValue?.length || 0;
  const maxCharacters = 100;

  const handleSubmit = form.handleSubmit(async (data) => {
    if (onSubmit) await onSubmit(data);
    form.reset();
  });

  const handleCancel = () => {
    form.reset();
    setPrioritySelected(null);
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
        {/* Main Content Section */}
        <Card className='p-2 gap-2 border-dashed'>
          <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <FileText className='size-4' />
            <span>Basic Information</span>
            <Badge variant='secondary' className='ml-auto text-xs'>
              Required
            </Badge>
          </div>

          <FormField
            control={form.control}
            name='summary'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base font-semibold flex items-center gap-2'>
                  Summary
                  <span className='text-destructive'>*</span>
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      placeholder='What needs to be done?'
                      autoFocus
                      className={cn(
                        'pr-16 transition-all duration-200',
                        errors.summary && 'border-destructive focus-visible:ring-destructive',
                        field.value && !errors.summary && 'border-green-500/50',
                      )}
                      maxLength={maxCharacters}
                      {...field}
                    />
                    <span
                      className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums transition-colors',
                        characterCount > maxCharacters * 0.9
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {characterCount}/{maxCharacters}
                    </span>
                  </div>
                </FormControl>
                <FormDescription className='text-xs'>
                  A clear, concise title for your issue
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base font-semibold flex items-center justify-between'>
                  <span>Description</span>
                  <Badge variant='outline' className='text-xs font-normal'>
                    Optional
                  </Badge>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the issue in detail.  What's the expected behavior?  What's happening instead?"
                    className='min-h-[100px] max-h-[200px] resize-y transition-all duration-200'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Metadata Section */}
        <Card className='p-2 gap-2'>
          <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <Settings2 className='h-4 w-4' />
            <span>Issue Configuration</span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            <FormField
              control={form.control}
              name='typeId'
              render={({ field }) => (
                <FormItem className='gap-2'>
                  <FormLabel className='text-sm font-medium flex items-center gap-2'>
                    Type
                    {field.value && <CheckCircle2 className='h-3.5 w-3.5 text-green-500' />}
                  </FormLabel>
                  <FormControl>
                    <IssueTypeSelectors
                      params={params}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      required={typeRequired}
                      filterFn={typeFilterFn}
                      onFetched={typeFetched}
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
                <FormItem className='gap-2'>
                  <FormLabel className='text-sm font-medium flex items-center gap-2'>
                    Priority
                    {prioritySelected && <CheckCircle2 className='h-3. 5 w-3.5 text-green-500' />}
                  </FormLabel>
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
        </Card>

        {/* Dates Section */}
        <Card className='p-2 gap-2'>
          <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <Calendar className='h-4 w-4' />
            <span>Timeline</span>
            <Badge variant='outline' className='ml-auto text-xs font-normal'>
              Optional
            </Badge>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            <FormField
              control={form.control}
              name='startDate'
              render={({ field }) => (
                <FormItem className='gap-2'>
                  <FormLabel className='text-sm font-medium'>Start Date</FormLabel>
                  <FormControl>
                    <IssueDateSelectors
                      placeholder='When does this start?'
                      value={
                        field.value
                          ? {
                              label: format(new Date(field.value), 'PPP'),
                              value: new Date(field.value),
                            }
                          : null
                      }
                      onChange={(dateOption) => {
                        const v = dateOption?.value ? format(dateOption.value, 'yyyy-MM-dd') : null;
                        field.onChange(v);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='dueDate'
              render={({ field }) => (
                <FormItem className='gap-2'>
                  <FormLabel className='text-sm font-medium'>Due Date</FormLabel>
                  <FormControl>
                    <IssueDateSelectors
                      placeholder='When is this due?'
                      value={
                        field.value
                          ? {
                              label: format(new Date(field.value), 'PPP'),
                              value: new Date(field.value),
                            }
                          : null
                      }
                      onChange={(dateOption) => {
                        const v = dateOption?.value ? format(dateOption.value, 'yyyy-MM-dd') : null;
                        field.onChange(v);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className='flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm'>
            <AlertCircle className='h-4 w-4 text-destructive mt-0.5 shrink-0' />
            <div className='text-destructive'>
              <p className='font-medium'>Please fix the following errors:</p>
              <ul className='list-disc list-inside mt-1 text-xs opacity-90'>
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{error?.message || `${key} is invalid`}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter className='gap-2 sm:gap-0 pt-2'>
          <div className='flex flex-col-reverse sm:flex-row justify-end items-center gap-2 w-full'>
            {isDirty && (
              <p className='text-xs text-muted-foreground mr-auto hidden sm:block'>
                Unsaved changes
              </p>
            )}
            <Button
              variant='ghost'
              type='button'
              onClick={handleCancel}
              disabled={isSubmitting}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !isValid}
              className={cn('min-w-[120px] w-full sm:w-auto transition-all duration-200')}
            >
              {isSubmitting ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <CheckCircle2 className='size-4' />
              )}
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
};
