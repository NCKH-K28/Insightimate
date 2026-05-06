'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

import { orgAPI } from '@/features/organization/api/http';
import { listOrgsInviteesQueryOptions, orgKeys } from '@/features/organization/api/actions';
import { OrgInvitation } from '@/contracts/organization/organization';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ZOrgSetup = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and dashes'),
});

type OrgSetupData = z.infer<typeof ZOrgSetup>;

type OrgSetupStepProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function OrgSetupStep({ onComplete, onSkip }: OrgSetupStepProps) {
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const { data: invitations = [], isLoading: isInvitationsLoading } = useQuery(
    listOrgsInviteesQueryOptions(),
  );

  const form = useForm<OrgSetupData>({
    resolver: zodResolver(ZOrgSetup),
    defaultValues: {
      name: '',
      slug: '',
    },
    mode: 'onBlur',
  });

  // Auto-generate slug from name
  const watchName = form.watch('name');
  React.useEffect(() => {
    if (watchName && !form.formState.dirtyFields.slug) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 48);
      form.setValue('slug', slug);
    }
  }, [watchName, form]);

  const createOrg = useMutation({
    mutationFn: (data: OrgSetupData) =>
      orgAPI.create({ name: data.name, slug: data.slug, logo: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      toast.success('Organization created!');
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create organization');
    },
  });

  const acceptInvite = useMutation({
    mutationFn: (token: string) => orgAPI.invitations.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      toast.success('Invitation accepted!');
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to accept invitation');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createOrg.mutate(data);
  });

  const pendingInvites = Array.isArray(invitations) ? invitations : [];

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='space-y-2 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
          <Building2 className='h-6 w-6 text-primary' />
        </div>
        <h2 className='text-2xl font-bold'>Set up your organization</h2>
        <p className='text-muted-foreground'>
          Create a new organization or join an existing one via invitation.
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
            Pending Invitations
          </h3>
          {pendingInvites.map((invite: any) => (
            <Card key={invite.id || invite.token}>
              <CardContent className='flex items-center justify-between py-3 px-4'>
                <div>
                  <p className='font-medium'>
                    {invite.organization?.name || invite.orgName || 'Organization'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Role: {invite.role || 'Member'}
                  </p>
                </div>
                <Button
                  size='sm'
                  onClick={() => acceptInvite.mutate(invite.token)}
                  disabled={acceptInvite.isPending}
                >
                  {acceptInvite.isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Accept'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Separator className='my-4' />
        </div>
      )}

      {/* Create New Org */}
      <Form {...form}>
        <form onSubmit={onSubmit} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name *</FormLabel>
                <FormControl>
                  <Input placeholder='My Organization' {...field} />
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
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input placeholder='my-organization' {...field} />
                </FormControl>
                <FormDescription>
                  Your organization will be accessible at /o/{field.value || 'slug'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex gap-3'>
            <Button
              type='submit'
              className='flex-1'
              disabled={!form.formState.isValid || createOrg.isPending}
            >
              {createOrg.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>

            <Button
              type='button'
              variant='ghost'
              onClick={onSkip}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
