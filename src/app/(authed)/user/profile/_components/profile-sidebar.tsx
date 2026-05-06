'use client';

import React from 'react';
import { User, Briefcase, Mail, Phone, Users, Layout, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { getMeQueryOptions, getMeProfileQueryOptions } from '@/features/user/api/actions';

function computeProfileCompletion(user: any, profile: any): number {
  const fields = [
    user?.name,
    user?.avatar || user?.image,
    user?.displayName,
    user?.firstName,
    user?.lastName,
    user?.coverImage,
    user?.timezone && user.timezone !== 'UTC',
    profile?.role,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function ProfileSidebar() {
  const { data: me } = useQuery(getMeQueryOptions());
  const { data: profile } = useQuery(getMeProfileQueryOptions());

  const displayName = me?.displayName || me?.name || 'User';
  const email = me?.email || '';
  const timezone = me?.timezone || 'UTC';
  const role = profile?.role;
  const completion = computeProfileCompletion(me, profile);

  return (
    <div className='space-y-6'>
      {/* Completion Card */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-semibold'>Complete your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4 mb-2'>
            <Progress value={completion} className='h-2' />
            <span className='text-sm font-medium text-muted-foreground'>{completion}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card>
        <CardHeader className='pb-4'>
          <CardTitle className='text-base font-semibold'>Profile</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* About */}
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              About
            </h4>

            <div className='flex items-center gap-3 text-sm'>
              <User className='h-4 w-4 text-muted-foreground' />
              <span>{displayName}</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Briefcase className='h-4 w-4 text-muted-foreground' />
              <span>{role || 'No role set'}</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Globe className='h-4 w-4 text-muted-foreground' />
              <span>{timezone}</span>
            </div>
          </div>

          <Separator />

          {/* Contacts */}
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Contacts
            </h4>

            <div className='flex items-center gap-3 text-sm'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span>{email}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
