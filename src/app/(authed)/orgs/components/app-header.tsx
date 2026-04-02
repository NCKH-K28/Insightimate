'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import React, { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { InsightmateLogoFull, InsightmateLogoIcon } from '@/components/icons/insightmate';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { getMeQueryOptions, signoutMutationOptions } from '@/features/authn/api/actions';
import { getInitials } from './org-shared';
import { AlertCircleIcon } from 'lucide-react';

type AppLogoProps = { className?: string; href?: string };
const AppLogo: React.FC<AppLogoProps> = ({ className, href = '/' }) => (
  <Link href={href} className={`${className}`}>
    <InsightmateLogoFull height={40} className='hidden md:inline-block' />
    <InsightmateLogoIcon height={40} className='inline-block md:hidden' />
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
      <Alert variant='destructive' className='w-auto flex flex-row items-center gap-2 px-3 py-2'>
        <AlertTitle>Failed to load user data</AlertTitle>
        <Tooltip>
          <TooltipTrigger>
            <AlertCircleIcon className='h-4 w-4' />
          </TooltipTrigger>
          <TooltipContent>
            <p>{fetchMe.error instanceof Error ? fetchMe.error.message : 'Unknown error'}</p>
          </TooltipContent>
        </Tooltip>
      </Alert>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='cursor-pointer'>
        <Avatar className='size-10 rounded-lg'>
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User Avatar'} />
          <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel className='font-semibold'>{user?.name ?? 'User'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => user && redirect(`/user/profile`)}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSignOut}>Sign Out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type AppHeaderProps = { className?: string };
export const AppHeader: React.FC<AppHeaderProps> = ({ className }) => (
  <div className={`flex items-center justify-between w-full px-4 ${className}`}>
    <AppLogo href='/orgs' />
    <AccountActions />
  </div>
);
