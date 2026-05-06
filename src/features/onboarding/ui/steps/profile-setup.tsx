'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { meApi } from '@/features/user/api/me-http';
import { getMeQueryOptions, userKeys } from '@/features/user/api/actions';

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

const ZProfileSetup = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  displayName: z.string().optional(),
  role: z.string().optional(),
});

type ProfileSetupData = z.infer<typeof ZProfileSetup>;

type ProfileSetupStepProps = {
  onComplete: () => void;
};

export function ProfileSetupStep({ onComplete }: ProfileSetupStepProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: me } = useQuery({
    ...getMeQueryOptions(),
    enabled: !!session?.user,
  });

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(ZProfileSetup),
    defaultValues: {
      firstName: me?.firstName ?? '',
      lastName: me?.lastName ?? '',
      displayName: me?.displayName ?? '',
      role: '',
    },
    values: me
      ? {
          firstName: me.firstName ?? '',
          lastName: me.lastName ?? '',
          displayName: me.displayName ?? '',
          role: '',
        }
      : undefined,
  });

  const updateMe = useMutation({
    mutationFn: async (data: ProfileSetupData) => {
      // Update user identity
      await meApi.updateMe({
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName || `${data.firstName} ${data.lastName}`,
        name: `${data.firstName} ${data.lastName}`,
      });

      // Update profile role if provided
      if (data.role) {
        await meApi.updateProfile({ role: data.role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.invalidateQueries({ queryKey: userKeys.meProfile() });
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMe.mutate(data);
  });

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='space-y-2 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
          <User className='h-6 w-6 text-primary' />
        </div>
        <h2 className='text-2xl font-bold'>Set up your profile</h2>
        <p className='text-muted-foreground'>
          Tell us a bit about yourself. This helps your team recognize you.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter first name' {...field} />
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
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter last name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='displayName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder='How others will see you' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem>
                <FormLabel>What&apos;s your role?</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. Software Engineer, Product Manager' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            className='w-full'
            disabled={!form.formState.isValid || updateMe.isPending}
          >
            {updateMe.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
