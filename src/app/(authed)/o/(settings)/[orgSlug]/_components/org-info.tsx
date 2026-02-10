import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { ZOrgUpdateInput } from '@/contracts/organization/organization.input';
import { OrgItem } from '@/contracts/organization/organization.query';

import AvatarUpload from '@/components/insightmate/avatar-upload';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useDeleteOrg, useUpdateOrg } from '@/hooks/org';
import { formatBytes } from '@/hooks/use-file-upload';
import { getDirtyValues } from '@/lib/react-hook-form';
import { uploadAPI } from '@/lib/api/upload-api';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
const SLUG_PREFIX = `${APP_DOMAIN}/o/`;
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const getFallbackName = (name: string) => {
  const names = name.trim().split(/\s+/);
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
  return (names[0][0] + names[1][0]).toUpperCase();
};

type TimezoneSelectorProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const TimezoneSelector = ({ value, onChange, disabled }: TimezoneSelectorProps) => {
  const timezones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className='w-full'>
        <SelectValue placeholder='Select a timezone' />
      </SelectTrigger>
      <SelectContent className='max-h-60 overflow-y-auto'>
        {timezones.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type OrgInfoProps = {
  org: OrgItem;
  onOrgUpdated?: (org: OrgItem) => void;
  onDeleted?: () => void;
};

export const OrgInfo: React.FC<OrgInfoProps> = ({ org, onOrgUpdated, onDeleted }) => {
  const perms = useMemo(() => org._me?.perms || [], [org]);
  const canUpdate = perms.includes('update');
  const canDelete = perms.includes('delete');

  const form = useForm({
    resolver: zodResolver(ZOrgUpdateInput),
    defaultValues: { ...org },
    mode: 'onBlur',
  });

  const updateOrg = useUpdateOrg({ id: org.id });
  const deleteOrg = useDeleteOrg({ id: org.id });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const { uploadURL, assetKey } = await uploadAPI.presign({
        kind: 'org-logo',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const rs = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!rs.ok) throw new Error('Failed to upload logo');
      return { key: assetKey };
    },
    onSuccess: (data) => form.setValue('logo', data.key, { shouldDirty: true }),
    onError: () => form.setValue('logo', null, { shouldDirty: true }),
  });

  const handleDelete = () => {
    deleteOrg.mutate(undefined, {
      onSuccess: () => onDeleted?.(),
      onError: (e: any) => toast.error(e?.message || 'Failed to delete organization'),
    });
  };

  const onSubmit = form.handleSubmit((data) => {
    const payload = getDirtyValues(form.formState.dirtyFields, data);

    return updateOrg.mutateAsync(payload, {
      onSuccess: (updated) => {
        form.reset(updated);
        onOrgUpdated?.(updated);
      },
      onError: (e: any) => toast.error(e?.message || 'Failed to update organization'),
    });
  });

  const isDirty = form.formState.isDirty;

  return (
    <section className='size-full'>
      <Form {...form}>
        <form onSubmit={onSubmit} className='space-y-4'>
          <FormField
            control={form.control}
            name='logo'
            render={({ field }) => (
              <div className='flex items-center gap-4'>
                <AvatarUpload
                  disabled={!canUpdate}
                  maxSize={MAX_LOGO_SIZE}
                  defaultAvatar={field.value ?? undefined}
                  classNames={{ dropzone: 'size-16 rounded-xl', image: 'rounded-xl' }}
                  onFileChange={(f) => {
                    if (f?.file instanceof File) uploadLogo.mutate(f.file);
                    else field.onChange(null);
                  }}
                  renderFallback={() => (
                    <Avatar className='size-16 rounded-xl'>
                      <AvatarFallback className='size-16 rounded-xl'>
                        {getFallbackName(form.getValues('name') ?? org.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                />

                <div>
                  <p className='font-medium'>{org.name}</p>
                  <p className='text-sm text-muted-foreground'>{SLUG_PREFIX + org.slug}</p>

                  <span className='text-sm text-muted-foreground'>
                    Max size: {formatBytes(MAX_LOGO_SIZE)}
                    {uploadLogo.isPending && (
                      <span className='ml-2 text-blue-600'>Uploading...</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={!canUpdate} className='w-full' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input disabled className='w-full' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='timezone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <TimezoneSelector
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={!canUpdate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {canUpdate && (
            <div>
              <Button type='submit' disabled={!isDirty || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>

              {isDirty && (
                <Button
                  type='button'
                  variant='link'
                  className='ml-4'
                  onClick={() => form.reset()}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>

      {canDelete && (
        <Alert className='mt-8 border-red-600 bg-red-50'>
          <AlertTitle className='font-medium text-red-800'>Delete Organization</AlertTitle>
          <AlertDescription className='text-red-700'>
            Deleting this organization is irreversible. All data associated with this organization
            will be permanently removed. Please proceed with caution.
            <AlertDialog>
              <AlertDialogTrigger asChild className='mt-2'>
                <Button variant='destructive' disabled={deleteOrg.isPending}>
                  {deleteOrg.isPending ? 'Deleting...' : 'Delete organization'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete this organization?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the organization and
                    all of its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-red-600 text-white hover:bg-red-700'
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
};
