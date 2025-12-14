'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';

const ZProfileUpdateInput = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  avatar: z.string().nullish(),
  phone: z.string().max(20).nullable(),
  bio: z.string().max(160).nullable(),
});

type ProfileUpdateInput = z.infer<typeof ZProfileUpdateInput>;

// Replace with actual API calls
const getProfile = async (): Promise<ProfileUpdateInput> => {
  // TODO: Implement actual API call
  return { name: '', avatar: null, phone: null, bio: null };
};

const updateProfile = async (data: ProfileUpdateInput) => {
  // TODO:  Implement actual API call
  return data;
};

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => toast.success('Profile updated successfully'),
    onError: (e) => toast.error(`Failed to update profile: ${e.message}`),
  });

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(ZProfileUpdateInput),
    defaultValues: profile ?? { name: '', avatar: null, phone: null, bio: null },
    values: profile,
  });

  const onSubmit = (data: ProfileUpdateInput) => mutation.mutate(data);

  const avatarUrl = form.watch('avatar');
  const name = form.watch('name');

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='container max-w-2xl py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your public profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Avatar */}
              <div className='flex items-center gap-4'>
                <Avatar className='w-20 h-20'>
                  <AvatarImage src={avatarUrl ?? undefined} alt={name ?? 'Avatar'} />
                  <AvatarFallback className='text-lg'>
                    {name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type='button' variant='outline' size='sm'>
                    <Upload className='w-4 h-4 mr-2' />
                    Upload Photo
                  </Button>
                  <p className='text-xs text-muted-foreground mt-1'>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              {/* Name */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your name' {...field} />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        placeholder='+1 (555) 000-0000'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us about yourself.. .'
                        className='resize-none'
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description for your profile. Max 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => form.reset()}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
