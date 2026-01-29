import { ZOrgUpdateInput } from '@/contracts/organizations/organization.input';
import { OrgItem } from '@/contracts/organizations/organization.query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AvatarUpload from '@/components/insightmate/avatar-upload';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/hooks/use-file-upload';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useDeleteOrg } from '@/hooks/org';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
const SLUG_PREFIX = APP_DOMAIN + `/o/`;
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const TimezoneSelector = (props?: { value?: string; onChange?: (value: string) => void }) => {
  const { value, onChange } = props || {};
  const timezones = Intl.supportedValuesOf('timeZone');
  return (
    <Select value={value} onValueChange={onChange}>
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

type OrgInfoProps = { org: OrgItem; onOrgUpdated?: (org: OrgItem) => void; onDelete?: () => void };
export const OrgInfo: React.FC<OrgInfoProps> = ({ org, onDelete }) => {
  const perms = useMemo(() => org._me?.perms || [], [org]);
  const canUpdate = perms.includes('update');
  const canDelete = perms.includes('delete');

  const deleteOrg = useDeleteOrg({ id: org.id });

  const handleDelete = () => {
    deleteOrg.mutate(undefined, {
      onSuccess: () => onDelete && onDelete(),
    });
  };

  const form = useForm({
    resolver: zodResolver(ZOrgUpdateInput),
    defaultValues: { ...org },
    mode: 'onBlur',
  });

  const getFallbackName = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].slice(0, 2).toUpperCase();
    } else {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
  };

  return (
    <section className='size-full'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))} className='space-y-4'>
          <FormField
            control={form.control}
            name='logo'
            render={({ field }) => (
              <div className='flex items-center gap-4'>
                <AvatarUpload
                  disabled={!canUpdate}
                  renderFallback={() => (
                    <Avatar className='size-16 rounded-xl'>
                      <AvatarFallback className='size-16 rounded-xl'>
                        {getFallbackName(form.getValues('name'))}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  defaultAvatar={field.value ?? undefined}
                  maxSize={MAX_LOGO_SIZE}
                  classNames={{ dropzone: 'size-16 rounded-xl', image: 'rounded-xl' }}
                />
                <div>
                  <p className='font-medium'>{org.name}</p>
                  <p className='text-sm text-muted-foreground'>{SLUG_PREFIX + org.slug}</p>
                  <span className='text-sm text-muted-foreground'>
                    Max size: {formatBytes(MAX_LOGO_SIZE)}
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

          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <FormControl>
              <TimezoneSelector />
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* Save Button */}
          {canUpdate && (
            <div>
              <Button
                type='submit'
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </Form>

      {canDelete && (
        <Alert className='mt-8 border-red-600 bg-red-50'>
          <AlertTitle className='text-red-800 font-medium'>Delete Organization</AlertTitle>
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
