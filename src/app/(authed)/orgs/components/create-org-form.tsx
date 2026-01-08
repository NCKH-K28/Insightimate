import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ZOrgCreateInput as ZRawCreateOrgFormData } from '@/contracts/organizations/organization.input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import AvatarUpload from '@/components/insightmate/avatar-upload';
import { formatBytes } from '@/hooks/use-file-upload';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, XIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';

const SLUG_PREFIX = 'app.com/o/';
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const ZFileOrPath = z.union([
  z.instanceof(File, { message: 'Must be a valid file' }),
  z.string().regex(/^\/.*/, 'Must be a valid file path'),
]);
export const ZCreateOrgFormData = ZRawCreateOrgFormData.extend({ logo: ZFileOrPath.nullable() });
export type CreateOrgFormData = z.infer<typeof ZCreateOrgFormData>;
export type UseCreateOrgForm = ReturnType<typeof useForm<CreateOrgFormData>>;

type BaseSettingsProps = { form: UseCreateOrgForm; className?: string; hidden?: boolean };
const BaseSettings: React.FC<BaseSettingsProps> = ({ form, className, hidden }) => {
  return (
    <div className={`flex flex-col gap-4 ${className || ''}`} hidden={hidden}>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Organization Name
              <span className='text-destructive'>*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder='Name' {...field} />
            </FormControl>
            <FormDescription className='text-xs'>
              Minimum 3 characters. This name will be visible to everyone.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='slug'
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Organization URL
              <span className='text-destructive'>*</span>
            </FormLabel>
            <FormControl>
              <div className='flex w-full overflow-hidden rounded-md border border-slate-300'>
                <span className='inline-flex items-center bg-slate-50 px-3 text-sm text-slate-500 select-none border-r border-slate-300'>
                  {SLUG_PREFIX}
                </span>

                <Input
                  className='border-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                  placeholder='organization-slug'
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className='text-xs'>
              Minimum 3 characters. Must be unique across the platform.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='logo'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Logo</FormLabel>
            <div className='flex flex-row gap-2'>
              <FormControl>
                <AvatarUpload
                  onFileChange={(f) => {
                    if (f) field.onChange(f.file);
                    else field.onChange(null);
                  }}
                  maxSize={MAX_LOGO_SIZE}
                  classNames={{ dropzone: 'size-16 rounded-xl', image: 'rounded-xl' }}
                />
              </FormControl>
              <FormDescription className='text-xs'>
                Accepted formats: PNG, JPG up to {formatBytes(MAX_LOGO_SIZE)}.
                <br />
                We&apos;ve auto-generated a logo for you.
                <br />
                You can upload a custom image later in settings.
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

type MemberSettingsProps = { form: UseCreateOrgForm; className?: string; hidden?: boolean };
const MemberSettings: React.FC<MemberSettingsProps> = ({ form, className, hidden }) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'invitees' });

  const roleOptions = useMemo(
    () => [
      { label: 'Admin', value: 'ORG_ADMIN' },
      { label: 'Member', value: 'ORG_MEMBER' },
    ],
    [],
  );

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`} hidden={hidden}>
      <p className='text-sm text-slate-600'>
        Add your teammates by email to get started. You can paste a list of emails here.
      </p>
      <div
        className='flex flex-col gap-4 max-h-72 overflow-y-auto'
        style={{ scrollbarGutter: 'stable', scrollbarWidth: 'thin' }}
      >
        {fields.map((field, index) => (
          <div key={field.id} className='w-full flex items-start justify-between gap-2'>
            <FormField
              control={form.control}
              name={`invitees.${index}.email`}
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`invitees.${index}.role`}
              render={({ field }) => (
                <FormItem className='w-40'>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={roleOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Role</SelectLabel>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='button' size='icon' variant='ghost' onClick={() => remove(index)}>
              <XIcon className='h-4 w-4' />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type='button'
        variant='link'
        className='text-sm'
        onClick={() => append({ email: '', role: 'ORG_MEMBER' })}
      >
        + Add another member
      </Button>
    </div>
  );
};

type CreateOrgFormProps = {
  defaultValues?: Partial<CreateOrgFormData>;
  onSubmit?: (data: CreateOrgFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export const CreateOrgForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: CreateOrgFormProps) => {
  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm({
    resolver: zodResolver(ZCreateOrgFormData),
    defaultValues: {
      name: '',
      slug: '',
      logo: null,
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const handleSummit = form.handleSubmit(
    (data) => onSubmit?.(data),
    (error) => console.log(error),
  );

  useEffect(() => {
    const callback = form.subscribe({
      name: 'name',
      formState: { values: true, dirtyFields: true },
      callback: ({ values }) => {
        const name = values.name ?? '';
        if (form.getFieldState('slug').isDirty) return;
        const slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 50);
        form.setValue('slug', slug);
      },
    });

    return () => callback();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={handleSummit} className='space-y-2'>
        <BaseSettings form={form} hidden={step !== 1} />
        <MemberSettings form={form} hidden={step !== 2} />

        <div className='flex justify-end gap-2 pt-4'>
          {step === 1 ? (
            <>
              <Button
                onClick={onCancel}
                type='button'
                variant='outline'
                className='text-slate-500 hover:text-slate-700 font-medium text-sm'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='button'
                key='continue'
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className='font-medium text-sm'
              >
                Continue
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button
                type='button'
                variant='outline'
                className='text-slate-500 hover:text-slate-700 font-medium text-sm'
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type='submit'
                className='font-medium text-sm'
                disabled={!form.formState.isValid || isSubmitting}
              >
                {isSubmitting && <Loader2 className='animate-spin' />}
                {isSubmitting ? 'Creating...' : 'Create Organization'}
              </Button>
            </>
          ) : null}
        </div>
      </form>
    </Form>
  );
};
