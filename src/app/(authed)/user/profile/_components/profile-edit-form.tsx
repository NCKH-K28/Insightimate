'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ZUserUpdateInput, type UserUpdateInput } from '@/contracts/user/user.input';
import {
  getMeQueryOptions,
  updateMeMutationOptions,
  userKeys,
} from '@/features/user/api/actions';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const TimezoneSelector = ({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) => {
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

export function ProfileEditForm() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useQuery(getMeQueryOptions());

  const form = useForm<UserUpdateInput>({
    resolver: zodResolver(ZUserUpdateInput),
    defaultValues: {
      name: me?.name ?? '',
      displayName: me?.displayName ?? '',
      firstName: me?.firstName ?? '',
      lastName: me?.lastName ?? '',
      timezone: me?.timezone ?? 'UTC',
    },
    values: me
      ? {
          name: me.name,
          displayName: me.displayName ?? '',
          firstName: me.firstName ?? '',
          lastName: me.lastName ?? '',
          timezone: me.timezone ?? 'UTC',
        }
      : undefined,
    mode: 'onBlur',
  });

  const updateMe = useMutation({
    ...updateMeMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMe.mutate(data);
  });

  const isDirty = form.formState.isDirty;

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Update your personal information and display settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className='space-y-6'>
            {/* Email (read-only) */}
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input disabled value={me?.email ?? ''} />
              </FormControl>
            </FormItem>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter your first name' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter your last name' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter your full name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='displayName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder='How others will see you' {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='timezone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <TimezoneSelector value={field.value ?? 'UTC'} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center gap-4'>
              <Button
                type='submit'
                disabled={!isDirty || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>

              {isDirty && (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => form.reset()}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
