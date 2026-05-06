'use client';

import React from 'react';
import { ProfileHeader } from './_components/profile-header';
import { ProfileSidebar } from './_components/profile-sidebar';
import { ActivityStream } from './_components/activity-stream';
import { ProfileEditForm } from './_components/profile-edit-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Page() {
  return (
    <div className='container mx-auto flex flex-col gap-2 py-2'>
      <ProfileHeader />

      {/* Tabs Navigation */}
      <Tabs defaultValue='profile' className='w-full rounded-none'>
        <TabsList className='rounded-none bg-transparent h-12 p-0 space-x-6 w-full justify-start overflow-x-auto'>
          <TabsTrigger
            value='profile'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 font-medium'
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value='activity'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground'
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value='settings'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground'
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value='profile'
          className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'
        >
          {/* Main Grid: Left Details + Right Activity */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-1'>
              <ProfileSidebar />
            </div>
            <div className='lg:col-span-2'>
              <ActivityStream />
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value='activity'
          className='animate-in fade-in slide-in-from-bottom-2 duration-300'
        >
          <ActivityStream />
        </TabsContent>

        <TabsContent
          value='settings'
          className='animate-in fade-in slide-in-from-bottom-2 duration-300'
        >
          <div className='max-w-2xl'>
            <ProfileEditForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
