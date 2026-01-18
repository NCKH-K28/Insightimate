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

type OrgInfoProps = { org: OrgItem; onOrgUpdated?: (org: OrgItem) => void };
export const OrgInfo: React.FC<OrgInfoProps> = ({ org }) => {
  const perms = useMemo(() => org._me?.perms || [], [org]);
  const canUpdate = perms.includes('update');

  const form = useForm({
    resolver: zodResolver(ZOrgUpdateInput),
    defaultValues: { ...org },
    mode: 'onBlur',
  });

  // const fallbackName = org.name.slice(0, 2).toUpperCase();
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
      <h2 className='text-xl font-semibold mb-2'>Organization Profile</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))} className='space-y-4'>
          <FormField
            control={form.control}
            name='logo'
            render={({ field }) => (
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
                maxSize={2 * 1024 * 1024}
                classNames={{ dropzone: 'size-16 rounded-xl', image: 'rounded-xl' }}
              />
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

          {/* Save Button */}
          {canUpdate && (
            <div>
              <Button
                type='submit'
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </section>
  );
};
