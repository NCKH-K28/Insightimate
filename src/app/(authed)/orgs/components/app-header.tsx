'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import React, { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { InsightmateLogoFull } from '@/components/icons/insightmate';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getMeQueryOptions, signoutMutationOptions } from '@/features/authn/api/actions';
import { getInitials } from './org-shared';

const AppLogo = () => (
  <Link href='/'>
    <InsightmateLogoFull height={40} />
    <span className='sr-only'>Insightmate</span>
  </Link>
);

const AccountActions = () => {
  const signOut = useMutation(signoutMutationOptions());
  const fetchMe = useQuery(getMeQueryOptions());

  const user = fetchMe.data;
  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const handleSignOut = () => {
    signOut.mutate(undefined, { onSuccess: () => redirect('/signin') });
  };

  if (fetchMe.isPending) return <Skeleton className='h-8 w-32 rounded-lg' />;

  if (fetchMe.isError) {
    return (
      <Alert variant='destructive'>
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          There was an error fetching your account information. Please sign in again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative p-1 flex items-center gap-2'>
          <Avatar className='h-8 w-8 rounded-lg'>
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? 'User Avatar'} />
            <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
          </Avatar>
          <p>{user?.name ?? 'Account'}</p>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel className='font-semibold'>{user?.name ?? 'User'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              window.location.href = '/user/profile';
            }}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSignOut}>Sign Out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const AppHeader = () => (
  <div className='flex items-center justify-between w-full px-4'>
    <AppLogo />
    <AccountActions />
  </div>
);
