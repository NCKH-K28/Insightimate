'use client';

import React from 'react';
import { Pencil, MoreHorizontal, Calendar, Building2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { getMeQueryOptions } from '@/features/user/api/actions';
import { format } from 'date-fns';
import Link from 'next/link';

export function ProfileHeader(props?: { className?: string }) {
  const { data: session } = authClient.useSession();
  const { data: me } = useQuery(getMeQueryOptions());

  const user = me ?? session?.user;
  const displayName = me?.displayName || user?.name || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = (user as any)?.avatar || (user as any)?.image;
  const coverImage = me?.coverImage;
  const joinDate = me?.dateJoined || me?.createdAt;

  return (
    <Card className={`p-0 overflow-hidden border-none shadow-sm ${props?.className}`}>
      {/* Banner */}
      <div className='h-48 md:h-64 relative'>
        {coverImage ? (
          <img
            src={coverImage}
            alt='Cover'
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-r from-orange-400 via-red-500 to-purple-600' />
        )}
        {/* Bottom gradient overlay */}
        <div className='absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent' />
        <div className='absolute top-4 right-4'>
          <Button
            size='icon'
            variant='secondary'
            className='h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm'
          >
            <Pencil className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Info Bar */}
      <div className='px-6 pb-6 pt-16 md:pt-4 relative flex flex-col md:flex-row items-center md:items-end justify-between text-center md:text-left'>
        {/* Avatar - Negative margin to pull it up */}
        <div className='absolute -top-12 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0'>
          <Avatar className='h-24 w-24 border-4 border-background shadow-md'>
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className='text-xl'>{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Name & Meta */}
        <div className='mt-4 md:mt-0 md:ml-32 flex-1'>
          <h1 className='text-2xl font-bold'>{displayName}</h1>
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-2'>
            {me?.firstName && me?.lastName && (
              <div className='flex items-center gap-1'>
                <Building2 className='h-4 w-4' />
                <span>
                  {me.firstName} {me.lastName}
                </span>
              </div>
            )}
            {joinDate && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                <span>Joined {format(new Date(joinDate), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='mt-4 md:mt-0 flex items-center gap-2'>
          <Button variant='outline' className='gap-2' asChild>
            <Link href='/user/settings'>
              <Settings className='h-4 w-4' />
              Settings
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>Share Profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
